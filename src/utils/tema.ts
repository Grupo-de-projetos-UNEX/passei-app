import { StatusMateria } from "../types/domain";

// Cores de status imutáveis
export const coresStatus = {
  aprovado: "#22C55E",
  em_jogo: "#EAB308",
  reprovado: "#EF4444",
  sem_dados: "#9CA3AF",
} as const;

// Paleta Light
export const temaClaro = {
  ...coresStatus,
  primaria: "#4F46E5",
  fundo: "#F9FAFB",
  superficie: "#FFFFFF",
  borda: "#E5E7EB",
  texto: "#111827",
  textoSecundario: "#6B7280",
  textoDesabilitado: "#9CA3AF",
  erro: "#EF4444",
  erroFundo: "#FEE2E2",
  erroBorda: "#FCA5A5",
  inputBg: "#FFFFFF",
  toggleFundo: "#E5E7EB",
};

// Paleta Dark
export const temaEscuro = {
  ...coresStatus,
  primaria: "#7C3AED",
  fundo: "#0D0D14",
  superficie: "#111118",
  borda: "rgba(255,255,255,0.08)",
  texto: "#FFFFFF",
  textoSecundario: "#6B6B80",
  textoDesabilitado: "#555570",
  erro: "#F87171",
  erroFundo: "rgba(239,68,68,0.08)",
  erroBorda: "rgba(239,68,68,0.2)",
  inputBg: "#111118",
  toggleFundo: "rgba(255,255,255,0.05)",
};

export const cores = temaClaro;

export type CoresTema = typeof temaClaro;

export const tipografia = {
  dmSans: { fontFamily: "DMSans_400Regular" },
  dmSansBold: { fontFamily: "DMSans_700Bold" },
  dmMono: { fontFamily: "DMMono_400Regular" },
} as const;

export function corDoStatus(status: StatusMateria): string {
  return coresStatus[status];
}
