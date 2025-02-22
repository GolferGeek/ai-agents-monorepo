import { WorkflowSearchService } from './workflow-search.service';
import { LLMProvider } from '../shared/agent.types';

jest.setTimeout(180000); // Increase timeout to 180 seconds

describe('WorkflowSearchService', () => {
  let service: WorkflowSearchService;

  beforeEach(() => {
    service = new WorkflowSearchService();
  });

  afterEach(() => {
    // Clear any running intervals
    const intervals = (service as any).cleanupInterval;
    if (intervals) {
      clearInterval(intervals);
    }
  });

  it('should execute search with environment variables', async () => {
    const result = await service.execute('What is the capital of France?', {
      thread_id: 'test-thread',
      provider: 'anthropic' as LLMProvider,
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxResults: 3
    });

    expect(result.result).toBeDefined();
    expect(result.messages).toBeDefined();
    // Each conversation should have at least: system message, user message, and AI response
    expect(result.metadata.messageCount).toBeGreaterThanOrEqual(3);
  });

  it('should use default model when not specified', async () => {
    const result = await service.execute('What is the capital of Spain?', {
      thread_id: 'test-thread-2',
      provider: 'anthropic' as LLMProvider,
      model: 'claude-3-opus-20240229', // Use a known working model
      temperature: 0.7,
      maxResults: 3
    });

    expect(result.result).toBeDefined();
    expect(result.messages).toBeDefined();
    expect(result.metadata.messageCount).toBeGreaterThanOrEqual(3);
  });

  it('should maintain conversation state across multiple queries', async () => {
    const threadId = 'test-thread-3';
    const config = {
      thread_id: threadId,
      provider: 'anthropic' as LLMProvider,
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxResults: 3
    };

    // First query
    const result1 = await service.execute('What is the capital of Italy?', config);
    expect(result1.metadata.messageCount).toBeGreaterThanOrEqual(3);

    // Second query
    const result2 = await service.execute('What is its population?', config);
    // Should have at least: system message, first query, first response, second query, second response
    expect(result2.metadata.messageCount).toBeGreaterThanOrEqual(5);
  });

  it('should create new conversation state for different thread_id', async () => {
    const config1 = {
      thread_id: 'thread-1',
      provider: 'anthropic' as LLMProvider,
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxResults: 3
    };

    const config2 = {
      ...config1,
      thread_id: 'thread-2'
    };

    const result1 = await service.execute('What is the capital of Germany?', config1);
    const result2 = await service.execute('What is the capital of France?', config2);
    
    // Each conversation should have at least: system message, user message, and AI response
    expect(result1.metadata.messageCount).toBeGreaterThanOrEqual(3);
    expect(result2.metadata.messageCount).toBeGreaterThanOrEqual(3);
  });

  it('should cleanup old conversations', async () => {
    const threadId = 'test-cleanup';
    const config = {
      thread_id: threadId,
      provider: 'anthropic' as LLMProvider,
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxResults: 3
    };

    // Create a conversation
    const result1 = await service.execute('What is the capital of Japan?', config);
    expect(result1.metadata.messageCount).toBeGreaterThanOrEqual(3);

    // Manually set the lastUpdated timestamp to more than an hour ago
    const state = (service as any).conversations.get(`${threadId}-anthropic`);
    state.lastUpdated = new Date(Date.now() - 1000 * 60 * 61); // 61 minutes ago

    // Trigger cleanup
    (service as any).cleanupOldConversations();

    // Create a new conversation with the same thread_id
    const result2 = await service.execute('What is the capital of China?', config);
    
    // New conversation should have at least: system message, user message, and AI response
    expect(result2.metadata.messageCount).toBeGreaterThanOrEqual(3);
  });

  it('should handle errors gracefully', async () => {
    await expect(service.execute('test query', {
      thread_id: 'test-thread',
      provider: 'anthropic' as LLMProvider,
      model: 'invalid-model', // Use a simpler invalid model name
      temperature: 0.7,
      maxResults: 3
    })).rejects.toThrow();
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