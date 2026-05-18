import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

jest.mock('@/shared/middlewares/autenticacao.middleware', () => ({
  middlewareAutenticacao: jest.fn((req: Request, res: Response, next: NextFunction) => {
    next();
  }),
}));

jest.mock('@/shared/middlewares/proxy.middleware', () => ({
  criarProxyHandler: jest.fn(() => (req: Request, res: Response) => {
    res.status(200).json({ mensagem: 'Passou pelo proxy!' });
  }),
}));

jest.mock('@/shared/clients/quiz.client', () => ({
  quizClient: { dummy: 'mock-client' }, 
}));

import { turmasRouter } from '@/routes/turmas.routes'; 
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';

describe('Turmas Router (BFF)', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use('/api/v1/turmas', turmasRouter);
  });


  it('deve passar pelo middleware de autenticação e chegar no proxy ao fazer um GET', async () => {
    const response = await request(app).get('/api/v1/turmas');

    expect(middlewareAutenticacao).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mensagem: 'Passou pelo proxy!' });
  });

  it('deve barrar a requisição se o middleware de autenticação falhar', async () => {
    (middlewareAutenticacao as jest.Mock).mockImplementationOnce((req: Request, res: Response) => {
      res.status(401).json({ erro: 'Não autorizado' });
    });

    const response = await request(app).get('/api/v1/turmas');

    expect(middlewareAutenticacao).toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ erro: 'Não autorizado' });
  });

  it('deve rotear qualquer método HTTP (POST, PUT, DELETE) e sub-rotas para o proxy', async () => {
    
    const responsePost = await request(app).post('/api/v1/turmas/123/alunos');
    expect(responsePost.status).toBe(200);

    const responseDelete = await request(app).delete('/api/v1/turmas/999');
    expect(responseDelete.status).toBe(200);
  });
});