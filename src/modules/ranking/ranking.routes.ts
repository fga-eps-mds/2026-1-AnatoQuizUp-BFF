import { Router } from "express";

import { middlewareAutenticacao } from "@/shared/middlewares/autenticacao.middleware";

import { RankingController } from "./ranking.controller";
import { RankingService } from "./ranking.service";

// Monta a cadeia do modulo de ranking: instancia o service, injeta no controller e
// liga cada endpoint ao seu handler. O modulo inteiro exige usuario autenticado.
const rankingService = new RankingService();
const rankingController = new RankingController(rankingService);

const rankingRouter = Router();

// Autenticacao aplicada a todas as rotas de ranking abaixo.
rankingRouter.use(middlewareAutenticacao);

// Aluno (e professor/admin): ranking geral de todos os alunos visiveis.
rankingRouter.get("/geral", rankingController.geral);

// Aluno: ranking entre os amigos confirmados + ele mesmo.
rankingRouter.get("/amigos", rankingController.amigos);

// Professor/Admin: ranking dos alunos de uma turma (desempenho geral no AnatoQuiz).
// A autorizacao por papel e garantida pelo Quiz-Service (apenasGestao).
rankingRouter.get("/turmas/:turmaId", rankingController.turma);

// Professor/Admin: ranking dos alunos em uma lista especifica da turma.
rankingRouter.get("/listas/:turmaId/:listaId", rankingController.lista);

export { rankingRouter };
