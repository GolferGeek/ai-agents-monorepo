import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';

describe('Agent Endpoints (e2e)', () => {
  let app: INestApplication;

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

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/lang-graph/agents (GET)', () => {
    it('should return list of available agents', () => {
      return request(app.getHttpServer())
        .get('/lang-graph/agents')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('capabilities');
          expect(res.body[0]).toHaveProperty('providers');
        });
    });
  });

  describe('/lang-graph/agents/:agentId (GET)', () => {
    it('should return simple-search agent metadata', () => {
      return request(app.getHttpServer())
        .get('/lang-graph/agents/simple-search')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'simple-search');
          expect(res.body.capabilities).toContain('web-search');
          expect(res.body.capabilities).toContain('result-summarization');
        });
    });

    it('should return workflow-search agent metadata', () => {
      return request(app.getHttpServer())
        .get('/lang-graph/agents/workflow-search')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'workflow-search');
          expect(res.body.capabilities).toContain('conversation-memory');
          expect(res.body.version).toBe('1.0.0');
        });
    });

    it('should return 404 for non-existent agent', () => {
      return request(app.getHttpServer())
        .get('/lang-graph/agents/non-existent')
        .expect(404);
    });
  });

  describe('/lang-graph/agents/:agentId/execute (POST)', () => {
    const searchRequest = {
      query: 'test query',
      config: {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        temperature: 0.7,
        thread_id: 'test-thread'
      }
    };

    it('should execute simple-search agent', () => {
      return request(app.getHttpServer())
        .post('/lang-graph/agents/simple-search/execute')
        .send(searchRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('metadata');
          expect(res.body.metadata).toHaveProperty('query', 'test query');
          expect(res.body.metadata).toHaveProperty('provider', 'anthropic');
        });
    });

    it('should execute workflow-search agent', () => {
      return request(app.getHttpServer())
        .post('/lang-graph/agents/workflow-search/execute')
        .send(searchRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('metadata');
          expect(res.body).toHaveProperty('messages');
          expect(res.body.metadata).toHaveProperty('conversationId', 'test-thread');
        });
    });

    it('should return 404 for non-existent agent', () => {
      return request(app.getHttpServer())
        .post('/lang-graph/agents/non-existent/execute')
        .send(searchRequest)
        .expect(404);
    });

    it('should return 400 for invalid request body', () => {
      return request(app.getHttpServer())
        .post('/lang-graph/agents/simple-search/execute')
        .send({})
        .expect(400);
    });
  });

  describe('/lang-graph/search (POST) - Legacy endpoint', () => {
    it('should execute simple-search agent', () => {
      return request(app.getHttpServer())
        .post('/lang-graph/search')
        .send({
          query: 'test query',
          config: {
            provider: 'anthropic',
            model: 'claude-3-opus-20240229',
            temperature: 0.7,
            thread_id: 'test-thread'
          }
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('metadata');
          expect(res.body.metadata).toHaveProperty('query', 'test query');
        });
    });
  });
}); 