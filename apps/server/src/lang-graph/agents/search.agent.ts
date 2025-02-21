import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { SearchAgentConfig } from '../types/search.types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from 'src/config/configuration';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

@Injectable()
export class SimpleSearchAgent {
    agentCheckpointer = new MemorySaver()
    private readonly openaiApiKey: string;
    private readonly anthropicApiKey: string;
    private readonly tavilyApiKey: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    this.openaiApiKey = this.configService.get('openai').apiKey;
    this.anthropicApiKey = this.configService.get('anthropic').apiKey;
    this.tavilyApiKey = this.configService.get('tavily').apiKey;
  }

  createChatModel(config: SearchAgentConfig) {
    const baseConfig = {
      streaming: false,
      maxRetries: 3,
    };

    switch (config.provider.toLowerCase()) {
      case 'openai':
        return new ChatOpenAI({
          ...baseConfig,
          modelName: config.model || 'gpt-4',
          temperature: config.temperature,
          openAIApiKey: this.openaiApiKey,
        });
      case 'anthropic':
        return new ChatAnthropic({
          ...baseConfig,
          modelName: config.model || 'claude-3-opus-20240229',
          temperature: config.temperature,
          anthropicApiKey: this.anthropicApiKey,
        });
      case 'ollama':
        return new ChatOllama({
          ...baseConfig,
          temperature: config.temperature,
          baseUrl: 'http://localhost:11434',
        });
      default:
        return new ChatOllama({
          ...baseConfig,
          temperature: config.temperature,
          baseUrl: 'http://localhost:11434',
        });
    }
  }

  public async runSearchAgent(
    searchQuery: string,
    config: SearchAgentConfig,
  ) {
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

      console.log('Creating search agent with Tavily API key:', this.tavilyApiKey);

      // Define the tools
      const searchTool = new TavilySearchResults({
        maxResults: 3,
        apiKey: this.tavilyApiKey,
      });

      // Create the model
      const model = this.createChatModel(config);

      // Create the system message
      const systemMessage = new SystemMessage({
        content: `You are a helpful AI assistant that can search the internet for information. You have access to search tools that you can use to find relevant information. When you need to search, use the available tools.

        Available tools:
        - tavily_search: Search the internet for current information

        Please provide accurate and up-to-date information based on search results.`,
      });

      const agent = createReactAgent({
        llm: model,
        tools: [searchTool],
        checkpointSaver: this.agentCheckpointer,
      });

      console.log('Invoking agent with thread_id:', config.thread_id);
      const response = await agent.invoke(
        {messages: [new HumanMessage(searchQuery)]},
        {configurable: {thread_id: config.thread_id}},

      );

      console.log('Response:', response);
      // Return the response content
      return typeof response.messages[response.messages.length - 1].content === 'string'
        ? response.messages[response.messages.length - 1].content.toString()
        : JSON.stringify(response.messages[response.messages.length - 1].content.toString());
    } catch (error) {
      console.error('Error in runSearchAgent:', error);
      throw error;
    }
  }
}

