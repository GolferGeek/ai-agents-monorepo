import { Module } from '@nestjs/common';
import { LangGraphController } from './lang-graph.controller';
import { LangGraphService } from './lang-graph.service';
import { SimpleSearchAgent } from './agents/search.agent';
@Module({
  imports: [],
  controllers: [LangGraphController],
  providers: [LangGraphService, SimpleSearchAgent],
  exports: [LangGraphService],
})
export class LangGraphModule {} 