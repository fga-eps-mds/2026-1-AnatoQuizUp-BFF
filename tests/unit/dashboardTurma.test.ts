import express from 'express';
import request from 'supertest';
import { turmaDashboardRouter } from '../../src/routes/dashboardTurma.routes'; 
import { middlewareAutenticacao } from '@/shared/middlewares/autenticacao.middleware';
import type { Request, Response } from 'express';


jest.mock('@/shared/middlewares/autenticacao.middleware', () => ({
  middlewareAutenticacao: jest.fn(),
}));

jest.mock('@/shared/middlewares/proxy.middleware', () => ({
  criarProxyHandler: jest.fn().mockReturnValue((req: Request, res: Response) => {
    res.status(200).json({ mockProxy: true, url: req.url });
  }),
}));

jest.mock('@/shared/clients/quiz.client', () => ({
  quizClient: { baseURL: 'http://mock-quiz-service' },
}));

describe('TurmaDashboard Router (BFF)', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();

    (middlewareAutenticacao as jest.Mock).mockImplementation((req, res, next) => {
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/api/v1/turmasDashboard', turmaDashboardRouter);
  });

  it('deve repassar a requisição para o proxy se o usuário estiver autenticado', async () => {

    const response = await request(app).get('/api/v1/turmasDashboard/turma-123/macro');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mockProxy: true,
      url: '/turma-123/macro', 
    });

    expect(middlewareAutenticacao).toHaveBeenCalled();
  });

  it('deve bloquear a requisição com 401 se a autenticação falhar', async () => {
    (middlewareAutenticacao as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(401).json({ erro: 'Não autorizado' });
    });

    const response = await request(app).get('/api/v1/turmasDashboard/turma-123/macro');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ erro: 'Não autorizado' });
  });

  it('deve repassar qualquer método HTTP (POST, PATCH, DELETE) para o proxy', async () => {
    const response = await request(app).post('/api/v1/turmasDashboard/turma-123/outra-rota');

    expect(response.status).toBe(200);
    expect(response.body.url).toBe('/turma-123/outra-rota');
  });
});