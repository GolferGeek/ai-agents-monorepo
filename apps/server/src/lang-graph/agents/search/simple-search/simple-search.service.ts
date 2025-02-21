import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent } from '../shared/agent.decorator';
import { SearchRequest, SearchResponse } from './interfaces';
import { SearchAgentConfig } from './types';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EnvironmentConfig } from '../../../../config/configuration';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';

@Injectable()
@Agent({
  id: 'simple-search',
  name: 'Simple Search Agent',
  description: 'A straightforward agent for performing internet searches and providing concise results',
  capabilities: ['web-search', 'result-summarization'],
  providers: ['anthropic', 'openai', 'ollama']
})
export class SimpleSearchService {
  private readonly agentCheckpointer = new MemorySaver();
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

  private createChatModel(config: SearchAgentConfig) {
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

  async execute(query: string, config: SearchAgentConfig): Promise<SearchResponse> {
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

      // Create search tool
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

      // Create the agent
      const agent = createReactAgent({
        llm: model,
        tools: [searchTool],
        checkpointSaver: this.agentCheckpointer,
      });

      // Execute the agent
      const response = await agent.invoke(
        { messages: [systemMessage, new HumanMessage(query)] },
        { configurable: { thread_id: config.thread_id } }
      );

      // Extract and return the result
      const result = response.messages[response.messages.length - 1].content;
      return {
        result: typeof result === 'string' ? result : JSON.stringify(result),
        metadata: {
          query,
          timestamp: new Date().toISOString(),
          provider: config.provider
        }
      };
    } catch (error) {
      console.error('Error in execute:', error);
      throw error;
    }
  }
} 