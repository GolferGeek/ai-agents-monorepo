import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WorkflowSearchService } from './workflow-search.service';
import { WorkflowSearchRequest } from './interfaces';
import { HumanMessage } from '@langchain/core/messages';

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

jest.mock('@langchain/langgraph', () => ({
  StateGraph: jest.fn().mockImplementation(() => ({
    addNode: jest.fn().mockReturnThis(),
    addEdge: jest.fn().mockReturnThis(),
    addConditionalEdges: jest.fn().mockReturnThis(),
    compile: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({
        messages: [{ content: 'Mock workflow response' }]
      })
    })
  })),
  MessagesAnnotation: {}
}));

describe('WorkflowSearchService', () => {
  let service: WorkflowSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowSearchService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<WorkflowSearchService>(WorkflowSearchService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    const mockRequest: WorkflowSearchRequest = {
      query: 'test query',
      config: {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        temperature: 0.7,
        thread_id: 'test-thread'
      }
    };

    it('should execute workflow search with Anthropic provider', async () => {
      const result = await service.execute(mockRequest.query, mockRequest.config);
      expect(result).toBeDefined();
      expect(result.metadata).toHaveProperty('query', 'test query');
      expect(result.metadata).toHaveProperty('provider', 'anthropic');
      expect(result.metadata).toHaveProperty('conversationId', 'test-thread');
      expect(result.messages).toBeDefined();
    });

    it('should maintain conversation state across multiple queries', async () => {
      // First query
      await service.execute(mockRequest.query, mockRequest.config);
      
      // Second query with same thread_id
      const followUpQuery = 'follow up question';
      const result = await service.execute(followUpQuery, mockRequest.config);
      
      expect(result.metadata.messageCount).toBeGreaterThan(1);
    });

    it('should create new conversation state for different thread_id', async () => {
      // First conversation
      await service.execute(mockRequest.query, mockRequest.config);
      
      // Second conversation with different thread_id
      const newRequest = {
        ...mockRequest,
        config: { ...mockRequest.config, thread_id: 'different-thread' }
      };
      const result = await service.execute(newRequest.query, newRequest.config);
      
      expect(result.metadata.messageCount).toBe(1);
    });

    it('should throw error when Tavily API key is missing', async () => {
      mockConfigService.get.mockImplementationOnce(() => ({ apiKey: null }));
      await expect(service.execute(mockRequest.query, mockRequest.config))
        .rejects
        .toThrow('Tavily API key is required');
    });

    it('should cleanup old conversations', async () => {
      jest.useFakeTimers();
      
      // Create a conversation
      await service.execute(mockRequest.query, mockRequest.config);
      
      // Advance time by 2 hours
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);
      
      // Create new conversation
      const newRequest = {
        ...mockRequest,
        config: { ...mockRequest.config, thread_id: 'new-thread' }
      };
      await service.execute(newRequest.query, newRequest.config);
      
      // Check that old conversation was cleaned up
      const result = await service.execute(mockRequest.query, mockRequest.config);
      expect(result.metadata.messageCount).toBe(1);
      
      jest.useRealTimers();
    });
  });

  describe('metadata', () => {
    it('should have correct agent metadata', () => {
      const metadata = Reflect.getMetadata('agent_metadata', WorkflowSearchService);
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('workflow-search');
      expect(metadata.capabilities).toContain('web-search');
      expect(metadata.capabilities).toContain('result-summarization');
      expect(metadata.capabilities).toContain('conversation-memory');
      expect(metadata.providers).toEqual(['anthropic', 'openai', 'ollama']);
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.modelConstraints).toBeDefined();
      expect(metadata.modelConstraints.minTokens).toBe(4096);
    });
  });
}); 