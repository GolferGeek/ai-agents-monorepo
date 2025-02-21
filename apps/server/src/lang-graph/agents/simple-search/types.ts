import { BaseAgentConfig, BaseAgentResponse, LLMProvider } from '../shared/agent.types';

export interface SearchAgentConfig extends BaseAgentConfig {
  maxResults?: number;
}

export interface SearchMetadata {
  query: string;
  timestamp: string;
  provider: LLMProvider;
  searchResults?: number;
} 