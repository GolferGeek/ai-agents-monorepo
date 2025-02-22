import { Injectable } from '@nestjs/common';
import { Agent } from '../shared/agent.decorator';
import { WorkflowSearchRequest, WorkflowSearchResponse } from './interfaces';
import { WorkflowSearchConfig } from './types';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
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
  private conversations: Map<string, ConversationState> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old conversations periodically
    this.cleanupInterval = setInterval(() => this.cleanupOldConversations(), 1000 * 60 * 60); // Every hour
    this.cleanupInterval.unref(); // Allow the process to exit even if the interval is still running
  }

  // Add cleanup method for proper resource management
  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.conversations.clear();
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
    const baseConfig = {
      streaming: false,
      maxRetries: 3,
      tags: process.env.NODE_ENV === 'test' ? ['test', 'workflow-search'] : undefined
    };

    switch (config.provider.toLowerCase()) {
      case 'openai':
        return new ChatOpenAI({
          ...baseConfig,
          modelName: config.model || 'gpt-4-turbo-preview',
          temperature: config.temperature,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
      case 'anthropic':
        return new ChatAnthropic({
          ...baseConfig,
          modelName: config.model || 'claude-3-opus-20240229',
          temperature: config.temperature,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
      case 'ollama':
        return new ChatOllama({
          ...baseConfig,
          temperature: config.temperature,
          model: config.model || 'llama2',
          baseUrl: 'http://localhost:11434',
        });
      default:
        return new ChatOllama({
          ...baseConfig,
          temperature: config.temperature,
          model: config.model || 'llama2',
          baseUrl: 'http://localhost:11434',
        });
    }
  }

  private createWorkflow(config: WorkflowSearchConfig) {
    // Define the tools for the agent to use
    const tools = [new TavilySearchResults({ 
      maxResults: config.maxResults || 3,
      apiKey: process.env.TAVILY_API_KEY
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
      // Get or create conversation state
      const conversationKey = `${config.thread_id}-${config.provider}`;
      let state = this.conversations.get(conversationKey);
      
      if (!state) {
        // Initialize new conversation with system message
        const systemMessage = new SystemMessage(
          'You are a helpful search assistant that can perform web searches and maintain conversation context. ' +
          'Use the available tools to search for information when needed.'
        );
        state = {
          app: this.createWorkflow(config),
          messages: [systemMessage],
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