export type TipoAtividade = 'OAT' | 'VA';

export type StatusMateria = 'aprovado' | 'em_jogo' | 'reprovado' | 'sem_dados';

export interface Profile {
  id: string;
  nome: string;
  percentual_aprovacao: number;
  created_at: string;
  updated_at: string;
}

export interface Materia {
  id: string;
  user_id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

export interface Atividade {
  id: string;
  materia_id: string;
  nome: string;
  tipo: TipoAtividade;
  pontos_maximos: number;
  pontos_obtidos: number | null;
  ordem: number;
  data_prevista: string | null;
  created_at: string;
  updated_at: string;
}
