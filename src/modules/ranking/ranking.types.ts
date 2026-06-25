export type UsuarioRequisicao = {
  id: string;
  papel: string;
  status: string;
};

export type RespostaApiSucesso<T> = {
  mensagem?: string;
  dados: T;
};

// ---- Dados vindos do Usuario-Service ----

export type ResumoAmigo = {
  id: string;
  nome: string;
  nickname: string | null;
  curso: string | null;
  semestre: string | null;
  visivel?: boolean;
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

export type ResumoAmizade = {
  id: string;
  statusAmizade: string;
  amigo: ResumoAmigo;
};

export type RespostaAmizades = {
  dados: ResumoAmizade[];
  metadados: { totalPages: number };
};

export type AlunoVisivel = {
  id: string;
  nome: string;
  nickname: string | null;
  curso: string | null;
  semestre: string | null;
};

export type ResumoUsuario = {
  id: string;
  nome: string;
  nickname: string | null;
};

export type UsuarioPublico = {
  id: string;
  nome: string;
  papel: string;
};

// ---- Dados vindos do Quiz-Service ----

export type PontuacaoUsuario = {
  usuarioId: string;
  totalAcertos: number;
  totalRespondidas: number;
  ultimaAtividade: string | null;
};

export type DesempenhoIndividualQuiz = {
  alunos: Array<{
    alunoId: string;
    totalRespondidas: number;
    totalAcertos: number;
    taxaAcerto: number;
    ultimaAtividade: string | null;
  }>;
};

export type StatusListaAluno = 'SUBMETIDA' | 'EM_ANDAMENTO' | 'NAO_RESPONDEU';

export type DesempenhoListaQuiz = {
  listaTurmaId: string;
  nomeLista: string;
  totalQuestoes: number;
  desempenhoAlunos: Array<{
    alunoId: string;
    status: StatusListaAluno;
    totalAcertos: number;
    taxaAcerto: number;
    submissaoEm: string | null;
    mensagem: string;
  }>;
};

// ---- Respostas do BFF (ranking) ----

export type EntradaRanking = {
  posicao: number;
  usuarioId: string;
  nome: string;
  nickname: string | null;
  curso: string | null;
  semestre: string | null;
  totalAcertos: number;
  totalRespondidas: number;
  taxaAcerto: number;
  ehUsuarioAtual: boolean;
  cosmeticos: ItemCosmetico[];
};

export type RankingAlunoResposta = {
  dados: EntradaRanking[];
  usuarioAtual: EntradaRanking | null;
  totalParticipantes: number;
};

export type EntradaRankingTurma = {
  posicao: number;
  alunoId: string;
  nome: string;
  nickname: string | null;
  totalAcertos: number;
  totalRespondidas: number;
  taxaAcerto: number;
  cosmeticos: ItemCosmetico[];
};

export type RankingTurmaResposta = {
  turmaId: string;
  totalAlunos: number;
  dados: EntradaRankingTurma[];
};

export type EntradaRankingLista = {
  posicao: number;
  alunoId: string;
  nome: string;
  nickname: string | null;
  status: StatusListaAluno;
  totalAcertos: number;
  taxaAcerto: number;
  submissaoEm: string | null;
  cosmeticos: ItemCosmetico[];
};

export type RankingListaResposta = {
  turmaId: string;
  listaTurmaId: string;
  nomeLista: string;
  totalQuestoes: number;
  dados: EntradaRankingLista[];
};
