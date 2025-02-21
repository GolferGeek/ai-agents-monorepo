import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SimpleSearchService } from './simple-search.service';
import { SearchRequest } from './interfaces';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      openai: { apiKey: 'mock-openai-key' },
      anthropic: { apiKey: 'mock-anthropic-key' },
      tavily: { apiKey: 'mock-tavily-key' }
    };
    return config[key];
  })
};

// Mock LangChain classes
jest.mock('@langchain/community/tools/tavily_search', () => ({
  TavilySearchResults: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue('Mock search results')
  }))
}));

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({ content: 'Mock OpenAI response' }),
    bindTools: jest.fn().mockReturnThis()
  }))
}));

jest.mock('@langchain/anthropic', () => ({
  ChatAnthropic: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({ content: 'Mock Anthropic response' }),
    bindTools: jest.fn().mockReturnThis()
  }))
}));

jest.mock('@langchain/ollama', () => ({
  ChatOllama: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({ content: 'Mock Ollama response' }),
    bindTools: jest.fn().mockReturnThis()
  }))
}));

jest.mock('@langchain/langgraph/prebuilt', () => ({
  createReactAgent: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      messages: [{ content: 'Mock agent response' }]
    })
  }))
}));

describe('SimpleSearchService', () => {
  let service: SimpleSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimpleSearchService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<SimpleSearchService>(SimpleSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    const mockRequest: SearchRequest = {
      query: 'test query',
      config: {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        temperature: 0.7,
        thread_id: 'test-thread'
      }
    };

    it('should execute search with Anthropic provider', async () => {
      const result = await service.execute(mockRequest.query, mockRequest.config);
      expect(result).toBeDefined();
      expect(result.metadata).toHaveProperty('query', 'test query');
      expect(result.metadata).toHaveProperty('provider', 'anthropic');
    });

    it('should throw error when Tavily API key is missing', async () => {
      mockConfigService.get.mockImplementationOnce(() => ({ apiKey: null }));
      await expect(service.execute(mockRequest.query, mockRequest.config))
        .rejects
        .toThrow('Tavily API key is required');
    });

    it('should throw error when OpenAI API key is missing for OpenAI provider', async () => {
      const openaiRequest = {
        ...mockRequest,
        config: { ...mockRequest.config, provider: 'openai' }
      };
      mockConfigService.get.mockImplementationOnce(() => ({ apiKey: null }));
      await expect(service.execute(openaiRequest.query, openaiRequest.config))
        .rejects
        .toThrow('OpenAI API key is required');
    });

    it('should throw error when Anthropic API key is missing for Anthropic provider', async () => {
      mockConfigService.get.mockImplementationOnce(() => ({ apiKey: null }));
      await expect(service.execute(mockRequest.query, mockRequest.config))
        .rejects
        .toThrow('Anthropic API key is required');
    });

    it('should use Ollama as fallback for unknown provider', async () => {
      const unknownRequest = {
        ...mockRequest,
        config: { ...mockRequest.config, provider: 'unknown' as any }
      };
      const result = await service.execute(unknownRequest.query, unknownRequest.config);
      expect(result).toBeDefined();
      expect(result.metadata).toHaveProperty('provider', 'unknown');
    });
  });

  describe('metadata', () => {
    it('should have correct agent metadata', () => {
      const metadata = Reflect.getMetadata('agent_metadata', SimpleSearchService);
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('simple-search');
      expect(metadata.capabilities).toContain('web-search');
      expect(metadata.capabilities).toContain('result-summarization');
      expect(metadata.providers).toEqual(['anthropic', 'openai', 'ollama']);
    });
  });
}); 