import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { AgentRegistryService } from './agent-registry.service';
import { SimpleSearchService } from '../agents/search/simple-search/simple-search.service';
import { WorkflowSearchService } from '../agents/search/workflow-search/workflow-search.service';
import { ConfigService } from '@nestjs/config';

// Mock services
const mockDiscoveryService = {
  getProviders: jest.fn()
};

const mockMetadataScanner = {
  scanFromPrototype: jest.fn()
};

const mockConfigService = {
  get: jest.fn()
};

describe('AgentRegistryService', () => {
  let service: AgentRegistryService;
  let discoveryService: DiscoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRegistryService,
        {
          provide: DiscoveryService,
          useValue: mockDiscoveryService
        },
        {
          provide: MetadataScanner,
          useValue: mockMetadataScanner
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        SimpleSearchService,
        WorkflowSearchService
      ],
    }).compile();

    service = module.get<AgentRegistryService>(AgentRegistryService);
    discoveryService = module.get<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    beforeEach(() => {
      mockDiscoveryService.getProviders.mockReset();
    });

    it('should discover and register agents', async () => {
      const mockSimpleSearchInstance = new SimpleSearchService(mockConfigService as any);
      const mockWorkflowSearchInstance = new WorkflowSearchService(mockConfigService as any);

      mockDiscoveryService.getProviders.mockReturnValue([
        { instance: mockSimpleSearchInstance },
        { instance: mockWorkflowSearchInstance },
        { instance: null }, // Test handling of null instances
        { instance: {} }    // Test handling of non-agent instances
      ]);

      await service.onModuleInit();

      expect(service.hasAgent('simple-search')).toBeTruthy();
      expect(service.hasAgent('workflow-search')).toBeTruthy();
      expect(service.hasAgent('non-existent')).toBeFalsy();
    });
  });

  describe('getAgent', () => {
    it('should return agent info for valid id', async () => {
      const mockSimpleSearchInstance = new SimpleSearchService(mockConfigService as any);
      mockDiscoveryService.getProviders.mockReturnValue([
        { instance: mockSimpleSearchInstance }
      ]);

      await service.onModuleInit();
      const agent = service.getAgent('simple-search');

      expect(agent).toBeDefined();
      expect(agent.metadata.id).toBe('simple-search');
      expect(agent.metadata.capabilities).toContain('web-search');
    });

    it('should return undefined for invalid id', () => {
      const agent = service.getAgent('non-existent');
      expect(agent).toBeUndefined();
    });
  });

  describe('getAllAgents', () => {
    it('should return all registered agents', async () => {
      const mockSimpleSearchInstance = new SimpleSearchService(mockConfigService as any);
      const mockWorkflowSearchInstance = new WorkflowSearchService(mockConfigService as any);

      mockDiscoveryService.getProviders.mockReturnValue([
        { instance: mockSimpleSearchInstance },
        { instance: mockWorkflowSearchInstance }
      ]);

      await service.onModuleInit();
      const agents = service.getAllAgents();

      expect(agents).toHaveLength(2);
      expect(agents[0].metadata.id).toBe('simple-search');
      expect(agents[1].metadata.id).toBe('workflow-search');
    });

    it('should return empty array when no agents registered', () => {
      mockDiscoveryService.getProviders.mockReturnValue([]);
      const agents = service.getAllAgents();
      expect(agents).toHaveLength(0);
    });
  });
}); 