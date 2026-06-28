import type { MetadadosPaginacao } from "@/shared/types/api.types";

// Tipos do perfil social: combinam amizades (Usuario-Service) com cosmeticos e
// conquistas (Quiz-Service) para montar a visao social de cada usuario.

// Identidade do usuario logado, resolvida pelo middleware de autenticacao.
export type UsuarioRequisicao = {
  id: string;
  papel: string;
  status: string;
};

export type ResumoAmigo = {
  id: string;
  nome: string;
  nickname: string | null;
  curso: string | null;
  semestre: string | null;
};

export type ResumoAmizade = {
  id: string;
  statusAmizade: string;
  amigo: ResumoAmigo;
};

// Lista paginada de amizades retornada pelo Usuario-Service.
export type RespostaAmizades = {
  dados: ResumoAmizade[];
  metadados: MetadadosPaginacao;
};

export type ItemCosmetico = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  valor: string | null;
  imagemUrl: string | null;
  previewImagemUrl: string | null;
};

// Conquista que o usuario escolheu destacar no perfil (tier = raridade/nivel).
export type ConquistaDestaque = {
  desbloqueioId: string;
  conquistaId: string;
  nome: string;
  descricao: string;
  tier: string;
  tipoConquista: string;
  tema: {
    id: string;
    nome: string;
  } | null;
  conquistadoEm: string;
};

// Dados sociais do Quiz agrupados por usuarioId (cosmeticos e conquistas em destaque).
export type DadosSociaisQuiz = {
  cosmeticos: Record<string, ItemCosmetico[]>;
  destaques: Record<string, ConquistaDestaque[]>;
};

// Perfil social completo de um unico usuario (resposta do endpoint de perfil).
export type PerfilSocial = {
  usuario: ResumoAmigo;
  cosmeticos: ItemCosmetico[];
  conquistasDestacadas: ConquistaDestaque[];
};

// Amizade ja enriquecida com os dados sociais, usada na listagem de amigos.
export type ResumoAmigoSocial = ResumoAmizade & {
  cosmeticos: ItemCosmetico[];
  conquistasDestacadas: ConquistaDestaque[];
};
