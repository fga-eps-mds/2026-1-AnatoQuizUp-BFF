// Service do perfil social. Orquestra Usuario-Service (amizades/identidade) e
// Quiz-Service (cosmeticos/conquistas), aplicando a regra de privacidade de so
// expor o perfil de quem e amigo confirmado do solicitante.
import { env } from "@/config/env";
import { backendClient } from "@/shared/clients/backend.client";
import { quizClient } from "@/shared/clients/quiz.client";
import { CodigoDeErro } from "@/shared/errors/codigos-de-erro";
import { ErroAplicacao } from "@/shared/errors/erro-aplicacao";

import type {
  DadosSociaisQuiz,
  PerfilSocial,
  RespostaAmizades,
  ResumoAmigo,
  ResumoAmigoSocial,
  UsuarioRequisicao,
} from "./perfil-social.types";

// Filtros e paginacao aceitos ao listar amigos.
type ListarAmigosQuery = {
  page?: number;
  limit?: number;
  nome?: string;
  nickname?: string;
};

// Formato generico das respostas do Quiz que agrupam itens por usuarioId.
type RespostaMapa<T> = {
  dados: Record<string, T[]>;
};

// Tamanho de pagina ao varrer as amizades em busca de um amigo especifico.
const LIMITE_BUSCA_AMIZADE = 100;

// Orquestra o "perfil social": combina a lista de amizades (Usuario-Service) com
// os dados de gamificacao - cosmeticos e conquistas em destaque (Quiz-Service).
export class PerfilSocialService {
  /**
   * Lista os amigos do usuario ja enriquecidos com dados sociais.
   *
   * Busca as amizades no Usuario-Service e, com os ids resultantes, agrega os
   * cosmeticos e conquistas em destaque vindos do Quiz-Service.
   *
   * @param usuario Usuario autenticado dono da lista de amigos.
   * @param authorization Header Authorization a repassar aos servicos.
   * @param query Filtros e paginacao da listagem de amigos.
   * @returns Lista de amigos com dados sociais e os metadados de paginacao.
   */
  async listarAmigosSociais(
    usuario: UsuarioRequisicao,
    authorization: string,
    query: ListarAmigosQuery,
  ) {
    const headers = this.montarHeaders(usuario, authorization);
    // Primeiro busca as amizades (ja paginadas/filtradas) no Usuario-Service.
    const { data: amizades } = await backendClient.get<RespostaAmizades>("/api/v1/amizade", {
      params: query,
      headers,
    });

    // Com os ids dos amigos, busca os dados sociais de todos de uma so vez.
    const usuarioIds = amizades.dados.map((amizade) => amizade.amigo.id);
    const sociais = await this.buscarDadosSociais(usuarioIds, headers);

    // Junta cada amizade aos seus cosmeticos/conquistas (vazio quando nao houver).
    const dados: ResumoAmigoSocial[] = amizades.dados.map((amizade) => ({
      ...amizade,
      cosmeticos: sociais.cosmeticos[amizade.amigo.id] ?? [],
      conquistasDestacadas: sociais.destaques[amizade.amigo.id] ?? [],
    }));

    // Repassa tambem os metadados de paginacao para o front continuar navegando.
    return {
      dados,
      metadados: amizades.metadados,
    };
  }

  /**
   * Retorna o perfil social de um unico usuario.
   *
   * Regra de privacidade: so devolve o perfil se o alvo for amigo confirmado de
   * quem pede; caso contrario, lanca 404 (nao da para bisbilhotar estranhos).
   *
   * @param usuario Usuario autenticado que faz a consulta.
   * @param authorization Header Authorization a repassar aos servicos.
   * @param usuarioId Id do usuario cujo perfil social se quer ver.
   * @returns Perfil social do amigo com cosmeticos e conquistas em destaque.
   * @throws ErroAplicacao 404 quando nao ha amizade confirmada.
   */
  async buscarPerfilSocial(
    usuario: UsuarioRequisicao,
    authorization: string,
    usuarioId: string,
  ): Promise<PerfilSocial> {
    const headers = this.montarHeaders(usuario, authorization);
    const amigo = await this.buscarAmigoConfirmado(usuarioId, headers);

    // Sem amizade confirmada o perfil nao e exposto: responde 404.
    if (!amigo) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: "Perfil social nao encontrado entre as amizades confirmadas.",
      });
    }

    // Confirmada a amizade, busca os dados sociais so deste usuario.
    const sociais = await this.buscarDadosSociais([usuarioId], headers);

    // Monta o perfil unindo a identidade do amigo aos seus cosmeticos e conquistas.
    return {
      usuario: amigo,
      cosmeticos: sociais.cosmeticos[usuarioId] ?? [],
      conquistasDestacadas: sociais.destaques[usuarioId] ?? [],
    };
  }

  /**
   * Procura um usuario especifico entre as amizades do solicitante.
   *
   * Pagina a lista de amizades ate encontrar o alvo ou esgotar as paginas,
   * encerrando mais cedo assim que encontra.
   *
   * @param usuarioId Id do usuario procurado.
   * @param headers Cabecalhos das chamadas internas.
   * @returns O resumo do amigo, ou null se ele nao for amigo confirmado.
   */
  private async buscarAmigoConfirmado(
    usuarioId: string,
    headers: Record<string, string>,
  ): Promise<ResumoAmigo | null> {
    // Comeca na primeira pagina; totalPages e ajustado apos a primeira resposta.
    let page = 1;
    let totalPages = 1;

    do {
      const { data } = await backendClient.get<RespostaAmizades>("/api/v1/amizade", {
        params: {
          page,
          limit: LIMITE_BUSCA_AMIZADE,
        },
        headers,
      });

      // Tenta localizar o alvo entre os amigos desta pagina.
      const amizade = data.dados.find((item) => item.amigo.id === usuarioId);

      // Achou nesta pagina: encerra a busca mais cedo.
      if (amizade) {
        return amizade.amigo;
      }

      // Atualiza o total real de paginas (so conhecido apos a 1a resposta) e avanca.
      totalPages = data.metadados.totalPages;
      page += 1;
    } while (page <= totalPages);

    return null;
  }

  /**
   * Busca os dados sociais (cosmeticos e conquistas em destaque) no Quiz-Service.
   *
   * As duas consultas sao independentes e por isso disparadas em paralelo. Sem ids,
   * devolve mapas vazios sem fazer chamada.
   *
   * @param usuarioIds Ids dos usuarios cujos dados sociais serao buscados.
   * @param headers Cabecalhos das chamadas internas.
   * @returns Dados sociais agrupados por usuarioId.
   */
  private async buscarDadosSociais(
    usuarioIds: string[],
    headers: Record<string, string>,
  ): Promise<DadosSociaisQuiz> {
    // Sem ids nao ha o que consultar; devolve mapas vazios e evita chamadas inuteis.
    if (usuarioIds.length === 0) {
      return {
        cosmeticos: {},
        destaques: {},
      };
    }

    // Cosmeticos e destaques sao independentes entre si: busca em paralelo.
    const ids = usuarioIds.join(",");
    const [cosmeticos, destaques] = await Promise.all([
      quizClient.get<RespostaMapa<DadosSociaisQuiz["cosmeticos"][string][number]>>(
        "/api/v1/inventario/usuarios/equipados",
        {
          params: { usuarioIds: ids },
          headers,
        },
      ),
      quizClient.get<RespostaMapa<DadosSociaisQuiz["destaques"][string][number]>>(
        "/api/v1/conquistas/usuarios/destaques",
        {
          params: { usuarioIds: ids },
          headers,
        },
      ),
    ]);

    // Extrai os mapas (ja agrupados por usuarioId) de cada resposta.
    return {
      cosmeticos: cosmeticos.data.dados,
      destaques: destaques.data.dados,
    };
  }

  /**
   * Monta os cabecalhos padrao das chamadas aos servicos internos.
   *
   * @param usuario Usuario autenticado da requisicao.
   * @param authorization Header Authorization original a repassar.
   * @returns Mapa de cabecalhos (token do usuario, identidade e token interno).
   */
  private montarHeaders(usuario: UsuarioRequisicao, authorization: string): Record<string, string> {
    return {
      Authorization: authorization,
      "x-internal-token": env.INTERNAL_TOKEN,
      "x-user-id": usuario.id,
      "x-user-papel": usuario.papel,
      "x-user-status": usuario.status,
    };
  }
}
