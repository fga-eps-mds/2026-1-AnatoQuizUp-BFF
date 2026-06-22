import type { MetadadosPaginacao } from "@/shared/types/api.types";

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

export type DadosSociaisQuiz = {
  cosmeticos: Record<string, ItemCosmetico[]>;
  destaques: Record<string, ConquistaDestaque[]>;
};

export type PerfilSocial = {
  usuario: ResumoAmigo;
  cosmeticos: ItemCosmetico[];
  conquistasDestacadas: ConquistaDestaque[];
};

export type ResumoAmigoSocial = ResumoAmizade & {
  cosmeticos: ItemCosmetico[];
  conquistasDestacadas: ConquistaDestaque[];
};
