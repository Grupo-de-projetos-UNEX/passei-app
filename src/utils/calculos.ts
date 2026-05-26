import { Atividade, StatusMateria } from '../types/domain';

export function calcularMeta(percentualAprovacao: number): number {
  return 100 * (percentualAprovacao / 100);
}

export function calcularPontosGarantidos(atividades: Atividade[]): number {
  return atividades
    .filter((a) => a.pontos_obtidos !== null)
    .reduce((soma, a) => soma + (a.pontos_obtidos as number), 0);
}

export function calcularPontosEmJogo(atividades: Atividade[]): number {
  return atividades
    .filter((a) => a.pontos_obtidos === null)
    .reduce((soma, a) => soma + a.pontos_maximos, 0);
}

export function calcularStatus(
  atividades: Atividade[],
  percentualAprovacao: number
): StatusMateria {
  const comNota = atividades.filter((a) => a.pontos_obtidos !== null);
  if (comNota.length === 0) return 'sem_dados';

  const meta = calcularMeta(percentualAprovacao);
  const garantidos = calcularPontosGarantidos(atividades);
  const emJogo = calcularPontosEmJogo(atividades);

  if (garantidos >= meta) return 'aprovado';
  if (garantidos + emJogo >= meta) return 'em_jogo';
  return 'reprovado';
}

export function calcularQuantoPrecisa(
  atividades: Atividade[],
  percentualAprovacao: number
): number {
  const meta = calcularMeta(percentualAprovacao);
  const garantidos = calcularPontosGarantidos(atividades);
  return Math.max(0, meta - garantidos);
}
