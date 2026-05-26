import { StatusMateria } from '../types/domain';

export const cores = {
  aprovado: '#22C55E',
  em_jogo: '#EAB308',
  reprovado: '#EF4444',
  sem_dados: '#9CA3AF',

  primaria: '#4F46E5',
  fundo: '#F9FAFB',
  superficie: '#FFFFFF',
  texto: '#111827',
  textoSecundario: '#6B7280',
  borda: '#E5E7EB',
} as const;

export function corDoStatus(status: StatusMateria): string {
  return cores[status];
}
