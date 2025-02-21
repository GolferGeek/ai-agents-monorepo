import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { LangGraphController } from './controllers/lang-graph.controller';
import { AgentRegistryService } from './services/agent-registry.service';
import { SimpleSearchService } from './agents/simple-search/simple-search.service';

@Module({
  imports: [DiscoveryModule],
  controllers: [LangGraphController],
  providers: [
    AgentRegistryService,
    SimpleSearchService
  ],
  exports: [AgentRegistryService]
})
export class LangGraphModule {} 