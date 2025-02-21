import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { LangGraphController } from './controllers/lang-graph.controller';
import { AgentRegistryService } from './services/agent-registry.service';
import { SimpleSearchService } from './agents/search/simple-search/simple-search.service';
import { WorkflowSearchService } from './agents/search/workflow-search/workflow-search.service';

@Module({
  imports: [DiscoveryModule],
  controllers: [LangGraphController],
  providers: [
    AgentRegistryService,
    SimpleSearchService,
    WorkflowSearchService
  ],
  exports: [AgentRegistryService]
})
export class LangGraphModule {} 