import { BaseAgentConfig, BaseAgentResponse, LLMProvider } from '../shared/agent.types';
import { BaseMessage } from '@langchain/core/messages';

export interface WorkflowSearchConfig extends BaseAgentConfig {
  maxResults?: number;
  previousMessages?: BaseMessage[];
}

export interface WorkflowSearchMetadata {
  query: string;
  timestamp: string;
  provider: LLMProvider;
  searchResults?: number;
  conversationId: string;
  messageCount: number;
} 