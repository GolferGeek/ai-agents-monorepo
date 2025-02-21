// agent.ts
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AgentConfig {
  provider: string;
  model: string;
  temperature: number;
  api_key?: string;  // Made optional since Ollama doesn't need an API key
  baseUrl?: string;  // Added for Ollama base URL configuration
  tavily_api_key: string;  // Required for Tavily search
}

// Function to create the appropriate chat model based on provider
function createChatModel(config: AgentConfig): any {
  switch (config.provider.toLowerCase()) {
    case 'ollama':
      return new ChatOllama({
        model: config.model || "mistral",
        temperature: config.temperature,
        baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      });
    case 'openai':
      if (!config.api_key) throw new Error('API key is required for OpenAI');
      return new ChatOpenAI({
        modelName: config.model || "gpt-4o",
        temperature: config.temperature,
        openAIApiKey: config.api_key,
      });
    case 'anthropic':
      if (!config.api_key) throw new Error('API key is required for Anthropic');
      return new ChatAnthropic({
        modelName: config.model,
        temperature: config.temperature,
        anthropicApiKey: config.api_key,
      });
    default:
      // Default to Ollama if provider is not specified or unknown
      console.log('Using default Ollama model');
      return new ChatOllama({
        model: "mistral",
        temperature: config.temperature || 0.7,
        baseUrl: config.baseUrl || "http://localhost:11434",
      });
  }
}

export async function runAgent(searchQuery: string, agentConfig: AgentConfig) {
  try {
    console.log('Creating tools with Tavily key:', agentConfig.tavily_api_key);

    // Define the tools for the agent to use
    const tools = [new TavilySearchResults({ 
      maxResults: 3,
      apiKey: agentConfig.tavily_api_key  // Changed to apiKey to match the expected parameter name
    })];
    const toolNode = new ToolNode(tools);

    // Create a model and give it access to the tools
    const model = createChatModel(agentConfig) as BaseChatModel & { bindTools: (tools: any[]) => BaseChatModel };
    const modelWithTools = model.bindTools(tools);

    // Define the function that determines whether to continue or not
    function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
      const lastMessage = messages[messages.length - 1] as AIMessage;
      return lastMessage.tool_calls?.length ? "tools" : "__end__";
    }

    // Define the function that calls the model
    async function callModel(state: typeof MessagesAnnotation.State) {
      const response = await modelWithTools.invoke(state.messages);
      return { messages: [response] };
    }

    // Define a new graph
    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("agent", callModel)
      .addEdge("__start__", "agent")
      .addNode("tools", toolNode)
      .addEdge("tools", "agent")
      .addConditionalEdges("agent", shouldContinue);

    // Compile the workflow
    const app = workflow.compile();

    // Execute the search
    const finalState = await app.invoke({
      messages: [new HumanMessage(searchQuery)],
    });

    // Return the last message content
    return finalState.messages[finalState.messages.length - 1].content;
  } catch (error) {
    console.error("Error in runAgent:", error);
    throw error;
  }
}