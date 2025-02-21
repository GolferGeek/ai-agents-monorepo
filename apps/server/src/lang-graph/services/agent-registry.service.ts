import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { AGENT_METADATA, AgentMetadata } from '../decorators/agent.decorator';

export interface AgentInfo {
  metadata: AgentMetadata;
  service: any;
}

@Injectable()
export class AgentRegistryService implements OnModuleInit {
  private agents: Map<string, AgentInfo> = new Map();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  async onModuleInit() {
    const providers = this.discoveryService.getProviders();
    
    providers.forEach(wrapper => {
      if (wrapper.instance) {
        const metadata = Reflect.getMetadata(AGENT_METADATA, wrapper.instance.constructor);
        if (metadata) {
          this.agents.set(metadata.id, {
            metadata,
            service: wrapper.instance
          });
        }
      }
    });
  }

  getAgent(id: string): AgentInfo | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  hasAgent(id: string): boolean {
    return this.agents.has(id);
  }
} 