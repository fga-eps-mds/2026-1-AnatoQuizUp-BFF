import { env } from "@/config/env";
import { backendClient } from "@/shared/clients/backend.client";
import { quizClient } from "@/shared/clients/quiz.client";

import type {
  AlunoVisivel,
  DesempenhoIndividualQuiz,
  DesempenhoListaQuiz,
  EntradaRanking,
  EntradaRankingLista,
  EntradaRankingTurma,
  ItemCosmetico,
  PontuacaoUsuario,
  RankingAlunoResposta,
  RankingListaResposta,
  RankingTurmaResposta,
  RespostaAmizades,
  RespostaApiSucesso,
  ResumoAmigo,
  ResumoUsuario,
  UsuarioPublico,
  UsuarioRequisicao,
} from "./ranking.types";

const LIMITE_AMIGOS = 100;
const LIMITE_PADRAO_GERAL = 100;
const PAPEIS_GESTAO = ["PROFESSOR", "ADMIN", "ADMINISTRADOR"];

type RespostaMapaCosmeticos = {
  dados: Record<string, ItemCosmetico[]>;
};

type EntradaInterna = Omit<EntradaRanking, "posicao"> & {
  ultimaAtividade: string | null;
};

function calcularTaxa(acertos: number, respondidas: number): number {
  return respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0;
}

/**
 * Regra de ordenacao da US: mais acertos primeiro; empate vai para quem
 * respondeu menos (mais eficiente); persistindo, para quem pontuou primeiro
 * (atividade mais antiga); e por fim ordem alfabetica.
 */
function compararEntradas(a: EntradaInterna, b: EntradaInterna): number {
  if (b.totalAcertos !== a.totalAcertos) {
    return b.totalAcertos - a.totalAcertos;
  }
  if (a.totalRespondidas !== b.totalRespondidas) {
    return a.totalRespondidas - b.totalRespondidas;
  }
  const tempoA = a.ultimaAtividade ? Date.parse(a.ultimaAtividade) : Number.POSITIVE_INFINITY;
  const tempoB = b.ultimaAtividade ? Date.parse(b.ultimaAtividade) : Number.POSITIVE_INFINITY;
  if (tempoA !== tempoB) {
    return tempoA - tempoB;
  }
  return a.nome.localeCompare(b.nome);
}

function ordenarEAtribuirPosicoes(internas: EntradaInterna[]): EntradaRanking[] {
  return [...internas].sort(compararEntradas).map((entrada, indice) => ({
    posicao: indice + 1,
    usuarioId: entrada.usuarioId,
    nome: entrada.nome,
    nickname: entrada.nickname,
    curso: entrada.curso,
    semestre: entrada.semestre,
    totalAcertos: entrada.totalAcertos,
    totalRespondidas: entrada.totalRespondidas,
    taxaAcerto: entrada.taxaAcerto,
    ehUsuarioAtual: entrada.ehUsuarioAtual,
    cosmeticos: entrada.cosmeticos,
  }));
}

export class RankingService {
  private montarHeaders(
    usuario: UsuarioRequisicao,
    authorization: string,
  ): Record<string, string> {
    return {
      Authorization: authorization,
      "x-internal-token": env.INTERNAL_TOKEN,
      "x-user-id": usuario.id,
      "x-user-papel": usuario.papel,
      "x-user-status": usuario.status,
    };
  }

  private ehGestao(papel: string): boolean {
    return PAPEIS_GESTAO.includes(papel);
  }

  private async buscarPontuacoes(
    headers: Record<string, string>,
    usuarioIds?: string[],
  ): Promise<Map<string, PontuacaoUsuario>> {
    const params =
      usuarioIds && usuarioIds.length > 0 ? { usuarioIds: usuarioIds.join(",") } : undefined;

    const { data } = await quizClient.get<RespostaApiSucesso<PontuacaoUsuario[]>>(
      "/api/v1/ranking/pontuacoes",
      { params, headers },
    );

    return new Map(data.dados.map((pontuacao) => [pontuacao.usuarioId, pontuacao]));
  }

  private async buscarCosmeticos(
    usuarioIds: string[],
    headers: Record<string, string>,
  ): Promise<Map<string, ItemCosmetico[]>> {
    if (usuarioIds.length === 0) {
      return new Map();
    }

    try {
      const { data } = await quizClient.get<RespostaMapaCosmeticos>(
        "/api/v1/inventario/usuarios/equipados",
        { params: { usuarioIds: usuarioIds.join(",") }, headers },
      );

      return new Map(Object.entries(data.dados));
    } catch {
      // Cosmeticos sao apenas decorativos no ranking; um erro aqui nao deve
      // derrubar o ranking inteiro.
      return new Map();
    }
  }

  private montarInterna(
    base: {
      id: string;
      nome: string;
      nickname: string | null;
      curso: string | null;
      semestre: string | null;
    },
    pontuacao: PontuacaoUsuario | undefined,
    usuarioAtualId: string,
    cosmeticos: ItemCosmetico[],
  ): EntradaInterna {
    const totalAcertos = pontuacao?.totalAcertos ?? 0;
    const totalRespondidas = pontuacao?.totalRespondidas ?? 0;

    return {
      usuarioId: base.id,
      nome: base.nome,
      nickname: base.nickname,
      curso: base.curso,
      semestre: base.semestre,
      totalAcertos,
      totalRespondidas,
      taxaAcerto: calcularTaxa(totalAcertos, totalRespondidas),
      ehUsuarioAtual: base.id === usuarioAtualId,
      cosmeticos,
      ultimaAtividade: pontuacao?.ultimaAtividade ?? null,
    };
  }

  private async buscarResumoProprio(
    usuarioId: string,
    headers: Record<string, string>,
  ): Promise<{ nome: string; nickname: string | null }> {
    const { data } = await backendClient.get<RespostaApiSucesso<UsuarioPublico>>(
      `/api/v1/usuarios/${usuarioId}`,
      { headers },
    );
    return { nome: data.dados.nome, nickname: null };
  }

  private async buscarNomesPorIds(
    ids: string[],
    headers: Record<string, string>,
  ): Promise<Map<string, ResumoUsuario>> {
    if (ids.length === 0) {
      return new Map();
    }

    const { data } = await backendClient.get<RespostaApiSucesso<ResumoUsuario[]>>(
      "/api/v1/usuarios",
      { params: { ids: ids.join(",") }, headers },
    );

    return new Map(data.dados.map((usuario) => [usuario.id, usuario]));
  }

  async rankingGeral(
    usuario: UsuarioRequisicao,
    authorization: string,
    limite = LIMITE_PADRAO_GERAL,
  ): Promise<RankingAlunoResposta> {
    const headers = this.montarHeaders(usuario, authorization);

    // Professor/Admin enxergam todos os alunos (inclusive os de perfil privado);
    // alunos so enxergam quem esta com o perfil visivel.
    const incluirPrivados = this.ehGestao(usuario.papel);
    const paramsVisiveis = incluirPrivados ? { incluirPrivados: "true" } : undefined;

    const [visiveis, pontuacoes] = await Promise.all([
      backendClient.get<RespostaApiSucesso<AlunoVisivel[]>>("/api/v1/usuarios/visiveis", {
        params: paramsVisiveis,
        headers,
      }),
      this.buscarPontuacoes(headers),
    ]);

    const alunos = visiveis.data.dados;
    const cosmeticos = await this.buscarCosmeticos(
      alunos.map((aluno) => aluno.id),
      headers,
    );

    const internas = alunos.map((aluno) =>
      this.montarInterna(
        aluno,
        pontuacoes.get(aluno.id),
        usuario.id,
        cosmeticos.get(aluno.id) ?? [],
      ),
    );

    const ordenadas = ordenarEAtribuirPosicoes(internas);
    const usuarioAtual = ordenadas.find((entrada) => entrada.ehUsuarioAtual) ?? null;

    return {
      dados: ordenadas.slice(0, limite),
      usuarioAtual,
      totalParticipantes: ordenadas.length,
    };
  }

  async rankingAmigos(
    usuario: UsuarioRequisicao,
    authorization: string,
  ): Promise<RankingAlunoResposta> {
    const headers = this.montarHeaders(usuario, authorization);

    const { data: amizades } = await backendClient.get<RespostaAmizades>("/api/v1/amizade", {
      params: { limit: LIMITE_AMIGOS },
      headers,
    });

    // Amigos com perfil privado nao entram no ranking (aluno -> aluno).
    const amigos: ResumoAmigo[] = amizades.dados
      .filter((amizade) => amizade.statusAmizade === "ATIVO")
      .map((amizade) => amizade.amigo)
      .filter((amigo) => amigo.visivel !== false);

    const ids = [usuario.id, ...amigos.map((amigo) => amigo.id)];

    const [resumoProprio, pontuacoes, cosmeticos] = await Promise.all([
      this.buscarResumoProprio(usuario.id, headers),
      this.buscarPontuacoes(headers, ids),
      this.buscarCosmeticos(ids, headers),
    ]);

    const internas: EntradaInterna[] = [
      this.montarInterna(
        {
          id: usuario.id,
          nome: resumoProprio.nome,
          nickname: resumoProprio.nickname,
          curso: null,
          semestre: null,
        },
        pontuacoes.get(usuario.id),
        usuario.id,
        cosmeticos.get(usuario.id) ?? [],
      ),
      ...amigos.map((amigo) =>
        this.montarInterna(
          amigo,
          pontuacoes.get(amigo.id),
          usuario.id,
          cosmeticos.get(amigo.id) ?? [],
        ),
      ),
    ];

    const ordenadas = ordenarEAtribuirPosicoes(internas);
    const usuarioAtual = ordenadas.find((entrada) => entrada.ehUsuarioAtual) ?? null;

    return {
      dados: ordenadas,
      usuarioAtual,
      totalParticipantes: ordenadas.length,
    };
  }

  async rankingTurma(
    usuario: UsuarioRequisicao,
    authorization: string,
    turmaId: string,
  ): Promise<RankingTurmaResposta> {
    const headers = this.montarHeaders(usuario, authorization);

    const { data } = await quizClient.get<DesempenhoIndividualQuiz>(
      `/api/v1/turmasDashboard/${turmaId}/individual`,
      { headers },
    );

    const alunoIds = data.alunos.map((aluno) => aluno.alunoId);
    const [nomes, cosmeticos] = await Promise.all([
      this.buscarNomesPorIds(alunoIds, headers),
      this.buscarCosmeticos(alunoIds, headers),
    ]);

    const internas = data.alunos.map((aluno) => ({
      alunoId: aluno.alunoId,
      nome: nomes.get(aluno.alunoId)?.nome ?? "Aluno",
      nickname: nomes.get(aluno.alunoId)?.nickname ?? null,
      totalAcertos: aluno.totalAcertos,
      totalRespondidas: aluno.totalRespondidas,
      taxaAcerto: aluno.taxaAcerto,
      ultimaAtividade: aluno.ultimaAtividade ?? null,
      cosmeticos: cosmeticos.get(aluno.alunoId) ?? [],
    }));

    internas.sort((a, b) => {
      if (b.totalAcertos !== a.totalAcertos) {
        return b.totalAcertos - a.totalAcertos;
      }
      if (a.totalRespondidas !== b.totalRespondidas) {
        return a.totalRespondidas - b.totalRespondidas;
      }
      return a.nome.localeCompare(b.nome);
    });

    const dados: EntradaRankingTurma[] = internas.map((entrada, indice) => ({
      posicao: indice + 1,
      alunoId: entrada.alunoId,
      nome: entrada.nome,
      nickname: entrada.nickname,
      totalAcertos: entrada.totalAcertos,
      totalRespondidas: entrada.totalRespondidas,
      taxaAcerto: entrada.taxaAcerto,
      cosmeticos: entrada.cosmeticos,
    }));

    return {
      turmaId,
      totalAlunos: data.alunos.length,
      dados,
    };
  }

  async rankingLista(
    usuario: UsuarioRequisicao,
    authorization: string,
    turmaId: string,
    listaId: string,
  ): Promise<RankingListaResposta> {
    const headers = this.montarHeaders(usuario, authorization);

    const { data } = await quizClient.get<DesempenhoListaQuiz>(
      `/api/v1/turmasDashboard/${turmaId}/listas/${listaId}`,
      { headers },
    );

    const alunoIds = data.desempenhoAlunos.map((aluno) => aluno.alunoId);
    const [nomes, cosmeticos] = await Promise.all([
      this.buscarNomesPorIds(alunoIds, headers),
      this.buscarCosmeticos(alunoIds, headers),
    ]);

    const internas = data.desempenhoAlunos.map((aluno) => ({
      ...aluno,
      nome: nomes.get(aluno.alunoId)?.nome ?? "Aluno",
      nickname: nomes.get(aluno.alunoId)?.nickname ?? null,
      cosmeticos: cosmeticos.get(aluno.alunoId) ?? [],
    }));

    internas.sort((a, b) => {
      if (b.totalAcertos !== a.totalAcertos) {
        return b.totalAcertos - a.totalAcertos;
      }
      if (b.taxaAcerto !== a.taxaAcerto) {
        return b.taxaAcerto - a.taxaAcerto;
      }
      const tempoA = a.submissaoEm ? Date.parse(a.submissaoEm) : Number.POSITIVE_INFINITY;
      const tempoB = b.submissaoEm ? Date.parse(b.submissaoEm) : Number.POSITIVE_INFINITY;
      if (tempoA !== tempoB) {
        return tempoA - tempoB;
      }
      return a.nome.localeCompare(b.nome);
    });

    const dados: EntradaRankingLista[] = internas.map((entrada, indice) => ({
      posicao: indice + 1,
      alunoId: entrada.alunoId,
      nome: entrada.nome,
      nickname: entrada.nickname,
      status: entrada.status,
      totalAcertos: entrada.totalAcertos,
      taxaAcerto: entrada.taxaAcerto,
      submissaoEm: entrada.submissaoEm,
      cosmeticos: entrada.cosmeticos,
    }));

    return {
      turmaId,
      listaTurmaId: data.listaTurmaId,
      nomeLista: data.nomeLista,
      totalQuestoes: data.totalQuestoes,
      dados,
    };
  }
}
