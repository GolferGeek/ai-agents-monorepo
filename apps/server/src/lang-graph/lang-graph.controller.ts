import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { LangGraphService } from './lang-graph.service';
import { SearchRequest, SearchResponse } from './types/search.types';

@Controller('lang-graph')
export class LangGraphController {
  constructor(private readonly langGraphService: LangGraphService) {}

  @Get()
  getStatus() {
    return this.langGraphService.getStatus();
  }

  @Get('agents')
  getAgents() {
    return this.langGraphService.getAgents();
  }

  @Post('agents/:agentId/execute')
  async executeAgent(
    @Param('agentId') agentId: string,
    @Body() executionData: any
  ) {
    try {
      return await this.langGraphService.executeAgent(agentId, executionData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to execute agent',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('search')
  async searchInternet(@Body() searchRequest: SearchRequest): Promise<SearchResponse> {
    try {
      return await this.langGraphService.executeAgent('search-agent', searchRequest);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to execute search',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('agents/:agentId/history')
  getAgentHistory(@Param('agentId') agentId: string) {
    return this.langGraphService.getAgentHistory(agentId);
  }
} 