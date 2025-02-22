import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { AgentRegistryService } from './agent-registry.service';
import { SimpleSearchService } from '../agents/search/simple-search/simple-search.service';
import { WorkflowSearchService } from '../agents/search/workflow-search/workflow-search.service';

describe('AgentRegistryService', () => {
  let service: AgentRegistryService;
  let discoveryService: DiscoveryService;
  let metadataScanner: MetadataScanner;

  beforeEach(() => {
    discoveryService = new DiscoveryService([] as any);
    metadataScanner = new MetadataScanner();
    service = new AgentRegistryService(discoveryService, metadataScanner);
  });

  it('should discover and register agents', async () => {
    const simpleSearch = new SimpleSearchService();
    const workflowSearch = new WorkflowSearchService();

    // Mock the discovery service to return our test instances
    jest.spyOn(discoveryService, 'getProviders').mockReturnValue([
      {
        instance: simpleSearch,
        name: 'SimpleSearchService',
        token: SimpleSearchService,
        metatype: SimpleSearchService,
        isAlias: false,
      } as any,
      {
        instance: workflowSearch,
        name: 'WorkflowSearchService',
        token: WorkflowSearchService,
        metatype: WorkflowSearchService,
        isAlias: false,
      } as any
    ]);

    await service.onModuleInit();

    expect(service.hasAgent('simple-search')).toBeTruthy();
    expect(service.hasAgent('workflow-search')).toBeTruthy();
    expect(service.hasAgent('non-existent')).toBeFalsy();
  });

  it('should get agent by id', async () => {
    const simpleSearch = new SimpleSearchService();

    // Mock the discovery service to return our test instance
    jest.spyOn(discoveryService, 'getProviders').mockReturnValue([
      {
        instance: simpleSearch,
        name: 'SimpleSearchService',
        token: SimpleSearchService,
        metatype: SimpleSearchService,
        isAlias: false,
      } as any
    ]);

    await service.onModuleInit();

    const agent = service.getAgent('simple-search');
    expect(agent).toBeDefined();
    expect(agent.metadata.id).toBe('simple-search');
    expect(agent.metadata.capabilities).toContain('web-search');
  });

  it('should get all agents', async () => {
    const simpleSearch = new SimpleSearchService();
    const workflowSearch = new WorkflowSearchService();

    // Mock the discovery service to return our test instances
    jest.spyOn(discoveryService, 'getProviders').mockReturnValue([
      {
        instance: simpleSearch,
        name: 'SimpleSearchService',
        token: SimpleSearchService,
        metatype: SimpleSearchService,
        isAlias: false,
      } as any,
      {
        instance: workflowSearch,
        name: 'WorkflowSearchService',
        token: WorkflowSearchService,
        metatype: WorkflowSearchService,
        isAlias: false,
      } as any
    ]);

    await service.onModuleInit();

    const agents = service.getAllAgents();
    expect(agents).toHaveLength(2);
    expect(agents[0].metadata.id).toBe('simple-search');
    expect(agents[1].metadata.id).toBe('workflow-search');
  });
}); 