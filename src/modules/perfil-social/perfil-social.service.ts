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

type ListarAmigosQuery = {
  page?: number;
  limit?: number;
  nome?: string;
  nickname?: string;
};

type RespostaMapa<T> = {
  dados: Record<string, T[]>;
};

const LIMITE_BUSCA_AMIZADE = 100;

export class PerfilSocialService {
  async listarAmigosSociais(
    usuario: UsuarioRequisicao,
    authorization: string,
    query: ListarAmigosQuery,
  ) {
    const headers = this.montarHeaders(usuario, authorization);
    const { data: amizades } = await backendClient.get<RespostaAmizades>("/api/v1/amizade", {
      params: query,
      headers,
    });

    const usuarioIds = amizades.dados.map((amizade) => amizade.amigo.id);
    const sociais = await this.buscarDadosSociais(usuarioIds, headers);

    const dados: ResumoAmigoSocial[] = amizades.dados.map((amizade) => ({
      ...amizade,
      cosmeticos: sociais.cosmeticos[amizade.amigo.id] ?? [],
      conquistasDestacadas: sociais.destaques[amizade.amigo.id] ?? [],
    }));

    return {
      dados,
      metadados: amizades.metadados,
    };
  }

  async buscarPerfilSocial(
    usuario: UsuarioRequisicao,
    authorization: string,
    usuarioId: string,
  ): Promise<PerfilSocial> {
    const headers = this.montarHeaders(usuario, authorization);
    const amigo = await this.buscarAmigoConfirmado(usuarioId, headers);

    if (!amigo) {
      throw new ErroAplicacao({
        codigoStatus: 404,
        codigo: CodigoDeErro.NAO_ENCONTRADO,
        mensagem: "Perfil social nao encontrado entre as amizades confirmadas.",
      });
    }

    const sociais = await this.buscarDadosSociais([usuarioId], headers);

    return {
      usuario: amigo,
      cosmeticos: sociais.cosmeticos[usuarioId] ?? [],
      conquistasDestacadas: sociais.destaques[usuarioId] ?? [],
    };
  }

  private async buscarAmigoConfirmado(
    usuarioId: string,
    headers: Record<string, string>,
  ): Promise<ResumoAmigo | null> {
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

      const amizade = data.dados.find((item) => item.amigo.id === usuarioId);

      if (amizade) {
        return amizade.amigo;
      }

      totalPages = data.metadados.totalPages;
      page += 1;
    } while (page <= totalPages);

    return null;
  }

  private async buscarDadosSociais(
    usuarioIds: string[],
    headers: Record<string, string>,
  ): Promise<DadosSociaisQuiz> {
    if (usuarioIds.length === 0) {
      return {
        cosmeticos: {},
        destaques: {},
      };
    }

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

    return {
      cosmeticos: cosmeticos.data.dados,
      destaques: destaques.data.dados,
    };
  }

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
