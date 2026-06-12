import { Materia } from './domain';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  AdicionarMateria: undefined;
  DetalheMateria: { materiaId: string };
  LancarNota: { atividadeId: string; materiaId: string };
  EditarAtividades: { materiaId: string };
  QuantoPreciso: { materia: Materia; percentualAprovacao: number };
  Configuracoes: undefined;
};
