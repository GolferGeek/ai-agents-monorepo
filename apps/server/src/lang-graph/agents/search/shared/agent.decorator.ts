import { SetMetadata } from '@nestjs/common';
import { 
  AgentCapability, 
  LLMProvider, 
  isValidCapability, 
  isValidLLMProvider 
} from './agent.types';

export const AGENT_METADATA = 'agent_metadata';

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  providers: LLMProvider[];
  version?: string;
  modelConstraints?: {
    minTokens?: number;
    requiredFeatures?: string[];
  };
}

export const Agent = (metadata: AgentMetadata) => {
  // Validate capabilities and providers at runtime
  metadata.capabilities.forEach(capability => {
    if (!isValidCapability(capability)) {
      throw new Error(`Invalid capability: ${capability}`);
    }
  });

  metadata.providers.forEach(provider => {
    if (!isValidLLMProvider(provider)) {
      throw new Error(`Invalid provider: ${provider}`);
    }
  });

  return SetMetadata(AGENT_METADATA, metadata);
}; 