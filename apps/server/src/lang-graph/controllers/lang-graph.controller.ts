import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { AgentRegistryService } from '../services/agent-registry.service';
import { SearchRequest, SearchResponse } from '../agents/simple-search/interfaces';

@Controller('lang-graph')
export class LangGraphController {
  constructor(
    private readonly agentRegistry: AgentRegistryService,
  ) {}

  @Get('agents')
  getAllAgents() {
    const agents = this.agentRegistry.getAllAgents();
    return agents.map(({ metadata }) => metadata);
  }

  @Get('agents/:agentId')
  getAgentMetadata(@Param('agentId') agentId: string) {
    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new HttpException(`Agent ${agentId} not found`, HttpStatus.NOT_FOUND);
    }
    return agent.metadata;
  }

  @Post('agents/:agentId/execute')
  async executeAgent(
    @Param('agentId') agentId: string,
    @Body() request: SearchRequest
  ): Promise<SearchResponse> {
    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new HttpException(`Agent ${agentId} not found`, HttpStatus.NOT_FOUND);
    }

    try {
      return await agent.service.execute(request.query, request.config);
    } catch (error) {
      throw new HttpException(
        error.message || `Failed to execute agent ${agentId}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Backward compatibility endpoint
  @Post('search')
  async searchInternet(@Body() request: SearchRequest): Promise<SearchResponse> {
    return this.executeAgent('simple-search', request);
  }
} 