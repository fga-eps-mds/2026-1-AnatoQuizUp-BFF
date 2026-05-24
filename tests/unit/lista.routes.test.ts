import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { listasRouter } from '../../src/routes/lista.routes';
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';
import { criarProxyHandler } from '@/shared/middlewares/proxy.middleware';
import { quizClient } from '@/shared/clients/quiz.client';

jest.mock('@/shared/middlewares/autenticacao.middleware', () => ({
  middlewareAutenticacao: jest.fn((req: Request, res: Response, next: NextFunction) => {
    next();
  }),
}));

jest.mock('@/shared/middlewares/proxy.middleware', () => ({
  criarProxyHandler: jest.fn().mockReturnValue((req: Request, res: Response) => {
    res.status(200).json({ mensagem: 'Proxy alcançado' });
  }),
}));

jest.mock('@/shared/clients/quiz.client', () => ({
  quizClient: { baseURL: 'http://mock-quiz-service' },
}));

describe('Listas Router (BFF Proxy)', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/api/v1/listas', listasRouter);
  });

  beforeEach(() => {
    (middlewareAutenticacao as jest.Mock).mockClear();
  });

  it('deve inicializar o proxy handler injetando o quizClient', () => {
    expect(criarProxyHandler).toHaveBeenCalledWith(quizClient);
  });

  it('deve interceptar requisições GET, validar autenticação e repassar ao proxy', async () => {
    const resposta = await request(app).get('/api/v1/listas');

    expect(middlewareAutenticacao).toHaveBeenCalled();
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ mensagem: 'Proxy alcançado' });
  });

  it('deve interceptar qualquer outro método (POST/DELETE) devido ao router.all(/.*)', async () => {
    const resposta = await request(app).post('/api/v1/listas/123/estatisticas/turma/456');

    expect(middlewareAutenticacao).toHaveBeenCalled();
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ mensagem: 'Proxy alcançado' });
  });
});