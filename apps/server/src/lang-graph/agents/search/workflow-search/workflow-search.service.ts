import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent } from '../../decorators/agent.decorator';
import { WorkflowSearchRequest, WorkflowSearchResponse } from './interfaces';
import { WorkflowSearchConfig } from './types';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { EnvironmentConfig } from '../../../config/configuration';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';

interface ConversationState {
  app: any;
  messages: BaseMessage[];
  lastUpdated: Date;
}

@Injectable()
@Agent({
  id: 'workflow-search',
  name: 'Workflow Search Agent',
  description: 'An advanced search agent that maintains conversation state and can handle follow-up queries',
  capabilities: ['web-search', 'result-summarization', 'conversation-memory'],
  providers: ['anthropic', 'openai', 'ollama'],
  version: '1.0.0',
  modelConstraints: {
    minTokens: 4096,
    requiredFeatures: ['tool-use', 'conversation-memory']
  }
})
export class WorkflowSearchService {
  private readonly openaiApiKey: string;
  private readonly anthropicApiKey: string;
  private readonly tavilyApiKey: string;
  private conversations: Map<string, ConversationState> = new Map();

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    this.openaiApiKey = this.configService.get('openai').apiKey;
    this.anthropicApiKey = this.configService.get('anthropic').apiKey;
    this.tavilyApiKey = this.configService.get('tavily').apiKey;

    // Clean up old conversations periodically
    setInterval(() => this.cleanupOldConversations(), 1000 * 60 * 60); // Every hour
  }

  private cleanupOldConversations() {
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);
    for (const [key, state] of this.conversations.entries()) {
      if (state.lastUpdated < oneHourAgo) {
        this.conversations.delete(key);
      }
    }
  }

  private createChatModel(config: WorkflowSearchConfig) {
    switch (config.provider.toLowerCase()) {
      case 'openai':
        return new ChatOpenAI({
          modelName: config.model || 'gpt-4',
          temperature: config.temperature,
          openAIApiKey: this.openaiApiKey,
        });
      case 'anthropic':
        return new ChatAnthropic({
          modelName: config.model || 'claude-3-opus-20240229',
          temperature: config.temperature,
          anthropicApiKey: this.anthropicApiKey,
        });
      case 'ollama':
        return new ChatOllama({
          model: config.model || 'llama2',
          temperature: config.temperature,
          baseUrl: 'http://localhost:11434',
        });
      default:
        return new ChatOllama({
          model: config.model || 'llama2',
          temperature: config.temperature,
          baseUrl: 'http://localhost:11434',
        });
    }
  }

  private createWorkflow(config: WorkflowSearchConfig) {
    // Define the tools for the agent to use
    const tools = [new TavilySearchResults({ 
      maxResults: config.maxResults || 3,
      apiKey: this.tavilyApiKey
    })];
    const toolNode = new ToolNode(tools);

    // Create a model and give it access to the tools
    const model = this.createChatModel(config).bindTools(tools);

    // Define the function that determines whether to continue or not
    function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
      const lastMessage = messages[messages.length - 1] as AIMessage;
      // If the LLM makes a tool call, then we route to the "tools" node
      if (lastMessage.tool_calls?.length) {
        return "tools";
      }
      // Otherwise, we stop (reply to the user) using the special "__end__" node
      return "__end__";
    }

    // Define the function that calls the model
    async function callModel(state: typeof MessagesAnnotation.State) {
      const response = await model.invoke(state.messages);
      // We return a list, because this will get added to the existing list
      return { messages: [response] };
    }

    // Define a new graph
    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("agent", callModel)
      .addEdge("__start__", "agent")
      .addNode("tools", toolNode)
      .addEdge("tools", "agent")
      .addConditionalEdges("agent", shouldContinue);

    // Compile it into a LangChain Runnable
    return workflow.compile();
  }

  async execute(query: string, config: WorkflowSearchConfig): Promise<WorkflowSearchResponse> {
    try {
      // Validate API keys
      if (!this.tavilyApiKey) {
        throw new Error('Tavily API key is required');
      }
      if (config.provider === 'openai' && !this.openaiApiKey) {
        throw new Error('OpenAI API key is required');
      }
      if (config.provider === 'anthropic' && !this.anthropicApiKey) {
        throw new Error('Anthropic API key is required');
      }

      // Get or create conversation state
      const conversationKey = `${config.thread_id}-${config.provider}`;
      let state = this.conversations.get(conversationKey);
      
      if (!state) {
        // Initialize new conversation
        state = {
          app: this.createWorkflow(config),
          messages: [],
          lastUpdated: new Date()
        };
        this.conversations.set(conversationKey, state);
      }

      // Add new query to conversation
      const newMessage = new HumanMessage(query);
      state.messages.push(newMessage);

      // Execute the workflow with full conversation history
      const finalState = await state.app.invoke(
        { messages: state.messages },
        { configurable: { thread_id: config.thread_id } }
      );

      // Update conversation state with new messages
      state.messages = finalState.messages;
      state.lastUpdated = new Date();

      // Extract the result
      const result = finalState.messages[finalState.messages.length - 1].content;
      
      return {
        result: typeof result === 'string' ? result : JSON.stringify(result),
        metadata: {
          query,
          timestamp: new Date().toISOString(),
          provider: config.provider,
          searchResults: config.maxResults || 3,
          conversationId: config.thread_id,
          messageCount: finalState.messages.length
        },
        messages: finalState.messages
      };
    } catch (error) {
      console.error('Error in execute:', error);
      throw error;
    }
  }
} 