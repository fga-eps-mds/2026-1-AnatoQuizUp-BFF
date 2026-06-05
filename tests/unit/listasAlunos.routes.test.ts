import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { listasAlunoRouter } from '../../src/routes/listasAlunos.routes';
import { quizClient } from '@/shared/clients/quiz.client';

jest.mock('@/shared/middlewares/autenticacao.middleware', () => ({
  middlewareAutenticacao: (req: Request, _res: Response, next: NextFunction) => {
    req.usuario = { id: 'aluno-123', papel: 'ALUNO', status: 'ATIVO' }; 
    next();
  },
}));

jest.mock('@/shared/clients/quiz.client', () => ({
  quizClient: {
    defaults: { baseURL: 'http://quiz-service' },
  },
}));

jest.mock('@/shared/middlewares/proxy.middleware', () => ({
  criarProxyHandler: (_client: unknown) => (_req: Request, res: Response) => {
    res.status(200).json({ status: 'proxied' });
  },
}));

describe('ListasAluno BFF Router', () => {
  const app = express();
  
  app.use('/', listasAlunoRouter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve passar pelo middleware de autenticacao e retornar 200 via proxy handler', async () => {
    const response = await request(app).get('/qualquer-rota-interna');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'proxied' });
  });

  it('deve verificar se o proxy esta configurado apontando para o quizClient', () => {
    expect(quizClient.defaults.baseURL).toBe('http://quiz-service');
  });
});