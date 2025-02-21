import { BaseAgentResponse } from '../shared/agent.types';
import { SearchAgentConfig, SearchMetadata } from './types';

export interface SearchRequest {
  query: string;
  config?: SearchAgentConfig;
}

export interface SearchResponse extends BaseAgentResponse<string> {
  metadata: SearchMetadata;
} 