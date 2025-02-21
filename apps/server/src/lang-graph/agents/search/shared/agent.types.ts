export type LLMProvider = 'anthropic' | 'openai' | 'ollama';

export type AgentCapability = 
  | 'web-search' 
  | 'result-summarization' 
  | 'code-search'
  | 'data-analysis'
  | 'text-extraction'
  | 'conversation-memory';

export interface BaseAgentConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
  thread_id: string;
}

export interface BaseAgentResponse<T> {
  result: T;
  metadata: {
    timestamp: string;
    provider: LLMProvider;
  };
}

// Type guard for LLM providers
export function isValidLLMProvider(provider: string): provider is LLMProvider {
  return ['anthropic', 'openai', 'ollama'].includes(provider);
}

// Type guard for capabilities
export function isValidCapability(capability: string): capability is AgentCapability {
  return [
    'web-search',
    'result-summarization',
    'code-search',
    'data-analysis',
    'text-extraction',
    'conversation-memory'
  ].includes(capability);
} 