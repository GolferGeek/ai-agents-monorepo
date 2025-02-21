export interface SearchAgentConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  model: string;
  temperature: number;
  thread_id: string;
}

export interface SearchRequest {
  query: string;
  config?: SearchAgentConfig;
}

export interface SearchResponse {
  executionId: string;
  result: string;
  timestamp: string;
} 