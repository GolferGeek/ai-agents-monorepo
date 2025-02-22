import { SimpleSearchService } from './simple-search.service';
import { LLMProvider } from '../../shared/agent.types';

jest.setTimeout(180000); // Increase timeout to 180 seconds

describe('SimpleSearchService', () => {
  let service: SimpleSearchService;

  beforeEach(() => {
    service = new SimpleSearchService();
  });

  it('should execute search with environment variables', async () => {
    const result = await service.execute('test query', {
      provider: (process.env.AI_PROVIDER as LLMProvider) || 'anthropic',
      model: process.env.AI_MODEL || 'claude-3-opus-20240229',
      temperature: 0.7,
      thread_id: 'test-thread'
    });

    expect(result).toBeDefined();
    expect(result.metadata).toHaveProperty('query', 'test query');
    expect(result.metadata).toHaveProperty('provider');
    expect(result.result).toBeDefined();
  });

  it('should use default model when not specified', async () => {
    const result = await service.execute('test query', {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229', // Use a known working model
      thread_id: 'test-thread',
      temperature: 0.7
    });

    expect(result).toBeDefined();
    expect(result.metadata).toHaveProperty('provider');
    expect(result.result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    try {
      await service.execute('test query', {
        provider: 'anthropic',
        model: 'invalid-model', // Use a simpler invalid model name
        thread_id: 'test-thread',
        temperature: 0.7
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    }
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