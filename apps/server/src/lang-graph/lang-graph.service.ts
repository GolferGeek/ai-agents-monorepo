import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from '../config/configuration';
import { SearchRequest, SearchResponse, SearchAgentConfig } from './types/search.types';
import { SimpleSearchAgent } from './agents/search.agent';
import { MessageContent } from '@langchain/core/messages';

@Injectable()
export class LangGraphService {
  private readonly openaiApiKey: string;
  private readonly anthropicApiKey: string;
  private readonly tavilyApiKey: string;

  constructor(private configService: ConfigService<EnvironmentConfig>, private searchAgent: SimpleSearchAgent) {
    this.openaiApiKey = this.configService.get('openai').apiKey;
    this.anthropicApiKey = this.configService.get('anthropic').apiKey;
    this.tavilyApiKey = this.configService.get('tavily').apiKey;
  }

  getStatus() {
    return {
      status: 'operational',
      version: '1.0.0',
      environment: this.configService.get('nodeEnv'),
    };
  }

  getAgents() {
    return {
      agents: [
        {
          id: 'search-agent',
          name: 'Internet Search Agent',
          description: 'Agent for searching and synthesizing information from the internet',
          status: 'active',
          availableModels: {
            openai: !!this.openaiApiKey,
            anthropic: !!this.anthropicApiKey,
            tavily: !!this.tavilyApiKey,
          }
        },
      ],
    };
  }

  async executeAgent(agentId: string, executionData: any) {
    const executionId = `exec-${Date.now()}`;
    
    if (agentId === 'search-agent') {
      const searchRequest = executionData as SearchRequest;
      
      // Default configuration if none provided
      const config: SearchAgentConfig = searchRequest.config || {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        temperature: 0.7,
        thread_id: executionId
      };

      try {
        const result = await this.searchAgent.runSearchAgent(
          searchRequest.query,
          config,
        );

        const response: SearchResponse = {
          executionId,
          result: result,
          timestamp: new Date().toISOString()
        };

        return response;
      } catch (error) {
        console.error(`Error executing search agent: ${error.message}`);
        throw error;
      }
    }

    throw new Error(`Unknown agent ID: ${agentId}`);
  }

  getAgentHistory(agentId: string) {
    return {
      agentId,
      history: [
        {
          executionId: 'exec-123',
          timestamp: new Date().toISOString(),
          status: 'completed',
        },
      ],
    };
  }
} 