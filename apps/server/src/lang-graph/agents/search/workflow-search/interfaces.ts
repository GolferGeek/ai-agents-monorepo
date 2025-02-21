import { BaseAgentResponse } from '../shared/agent.types';
import { WorkflowSearchConfig, WorkflowSearchMetadata } from './types';
import { BaseMessage } from '@langchain/core/messages';

export interface WorkflowSearchRequest {
  query: string;
  config?: WorkflowSearchConfig;
  previousMessages?: BaseMessage[];
}

export interface WorkflowSearchResponse extends BaseAgentResponse<string> {
  metadata: WorkflowSearchMetadata;
  messages: BaseMessage[];  // Include full conversation history
} 