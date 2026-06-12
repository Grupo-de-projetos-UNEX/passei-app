import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { Atividade } from '../../types/domain';
import { RootStackParamList } from '../../types/navigation';
import {
  calcularMeta,
  calcularPontosGarantidos,
  calcularPontosEmJogo,
  calcularQuantoPrecisa,
  calcularStatus,
} from '../../utils/calculos';

// IMPORTAÇÃO DOS TEMAS (ajuste o caminho conforme a sua pasta)
import { temaClaro, temaEscuro, CoresTema } from '../../utils/tema';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Nav = StackNavigationProp<RootStackParamList, 'QuantoPreciso'>;
type Route = RouteProp<RootStackParamList, 'QuantoPreciso'>;

// ─── Componente de atividade pendente ─────────────────────────────────────────

function AtividadePendenteCard({
  atividade,
  minimo,
  tema,
  estilos,
}: {
  atividade: Atividade;
  minimo: number;
  tema: CoresTema;
  estilos: ReturnType<typeof criarEstilos>;
}) {
  const progresso = Math.min(1, minimo / atividade.pontos_maximos);
  const tipo = atividade.tipo; 
  const corTipo = tipo === 'OAT' ? tema.primaria : '#a78bfa'; 

  return (
    <View style={estilos.atividadeCard}>
      <View style={estilos.atividadeHeader}>
        <View style={estilos.atividadeNomeRow}>
          <Text style={estilos.atividadeNome}>{atividade.nome}</Text>
          <View style={[estilos.tipoBadge, { backgroundColor: corTipo + '22' }]}>
            <Text style={[estilos.tipoBadgeText, { color: corTipo }]}>{tipo}</Text>
          </View>
        </View>
        <Text style={estilos.atividadeMinimo}>
          min. <Text style={[estilos.atividadeMinimoValor, { color: tema.em_jogo }]}>{minimo.toFixed(1)}</Text>
        </Text>
      </View>

      <View style={estilos.atividadeBarra}>
        <View style={estilos.atividadeBarraFundo}>
          <View
            style={[
              estilos.atividadeBarraPreench,
              { width: `${progresso * 100}%` as any, backgroundColor: tema.em_jogo },
            ]}
          />
        </View>
        <View style={estilos.atividadeBarraLabels}>
          <Text style={estilos.atividadeBarraLabel}>0</Text>
          <Text style={estilos.atividadeBarraLabel}>{atividade.pontos_maximos} pts</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Sub-componentes simples ──────────────────────────────────────────────────

function ResumoLinha({ label, valor, estilos }: { label: string; valor: string, estilos: any }) {
  return (
    <View style={estilos.resumoLinha}>
      <Text style={estilos.resumoLabel}>{label}</Text>
      <Text style={estilos.resumoValor}>{valor}</Text>
    </View>
  );
}

function Divisor({ estilos }: { estilos: any }) {
  return <View style={estilos.divisor} />;
}


// ─── Tela principal ────────────────────────────────────────────────────────────

export default function QuantoPrecisoScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { materia, percentualAprovacao } = route.params;

  // ── Tema Dinâmico ──
  const isDark = useColorScheme() === 'dark';
  const tema = isDark ? temaEscuro : temaClaro;
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarAtividades = useCallback(async () => {
      try {
        setErro(null);
        const { data, error } = await supabase
          .from('atividades')
          .select('*')
          .eq('materia_id', materia.id)
          .order('ordem', { ascending: true });
  
        if (error) throw error;
        setAtividades(data ?? []);
      } catch (e: any) {
        setErro(e?.message ?? 'Erro ao carregar atividades.');
      } finally {
        setLoading(false);
      }
    }, [materia.id]);

  useEffect(() => {
    carregarAtividades();
  }, [carregarAtividades]);

  const meta = calcularMeta(percentualAprovacao);
  const garantidos = calcularPontosGarantidos(atividades);
  const emJogo = calcularPontosEmJogo(atividades);
  const precisa = calcularQuantoPrecisa(atividades, percentualAprovacao);
  const status = calcularStatus(atividades, percentualAprovacao);
  const pendentes = atividades.filter((a) => a.pontos_obtidos === null);
  const temDados = atividades.some((a) => a.pontos_obtidos !== null);

  function minimoParaAtividade(atividade: Atividade): number {
    if (pendentes.length === 0 || precisa <= 0) return 0;
    const proporcao = atividade.pontos_maximos / emJogo;
    return Math.min(atividade.pontos_maximos, precisa * proporcao);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tema.primaria} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={tema.erro} />
        <Text style={styles.erroTexto}>{erro}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={tema.fundo} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnVoltar}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={tema.texto} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitulo}>Quanto preciso?</Text>
          <Text style={styles.headerSub}>{materia.nome}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {!temDados && (
          <View style={styles.cardNeutro}>
            <Ionicons name="time-outline" size={32} color={tema.sem_dados} style={{ marginBottom: 12 }} />
            <Text style={styles.semDadosTitulo}>
              Lance pelo menos uma nota{'\n'}para calcular sua meta.
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.semDadosLink}>← Voltar para lançar</Text>
            </TouchableOpacity>
          </View>
        )}

        {temDados && status === 'aprovado' && (
          <View style={[styles.cardDestaque, styles.cardAprovado]}>
            <Ionicons name="checkmark-circle" size={32} color={tema.aprovado} style={{ marginBottom: 12 }} />
            <Text style={styles.cardDestaqueTexto}>
              Você já atingiu a{' '}
              <Text style={{ color: tema.aprovado, fontWeight: '700' }}>meta de aprovação!</Text>
            </Text>
            <Text style={styles.cardDestaqueSubtexto}>
              {garantidos.toFixed(0)} pts garantidos de {meta.toFixed(0)} pts necessários.
            </Text>
          </View>
        )}

        {temDados && status === 'reprovado' && (
          <View style={[styles.cardDestaque, styles.cardReprovado]}>
            <Ionicons name="close-circle" size={32} color={tema.reprovado} style={{ marginBottom: 12 }} />
            <Text style={styles.cardDestaqueTexto}>
              Não é mais possível{' '}
              <Text style={{ color: tema.reprovado, fontWeight: '700' }}>atingir a meta para passar.</Text>
            </Text>
            <Text style={styles.cardDestaqueSubtexto}>
              Você tem {garantidos.toFixed(0)} pts, mas precisaria de {meta.toFixed(0)} pts.
              Mesmo tirando nota máxima nas avaliações ou atividades pendentes, o máximo seria {(garantidos + emJogo).toFixed(0)} pts.
            </Text>
          </View>
        )}

        {temDados && status === 'em_jogo' && (
          <View style={[styles.cardDestaque, styles.cardEmJogo]}>
            <Ionicons name="warning" size={32} color={tema.em_jogo} style={{ marginBottom: 12 }} />
            <Text style={styles.cardDestaqueTexto}>
              Você precisa de mais{' '}
              <Text style={{ color: tema.em_jogo, fontWeight: '700' }}>{precisa.toFixed(0)} pts</Text>{' '}
              para passar.
            </Text>
            <Text style={styles.cardDestaqueSubtexto}>
              Tem {garantidos.toFixed(0)} pts garantidos. Faltam {pendentes.length} atividade{pendentes.length !== 1 ? 's' : ''},{' '}
              valendo {emJogo.toFixed(0)} pts no total.
            </Text>
            {pendentes.length > 0 && emJogo > 0 && (
              <Text style={styles.cardDestaqueSubtexto}>
                Se tirar média{' '}
                <Text style={{ color: tema.em_jogo, fontWeight: '700' }}>
                  {(precisa / pendentes.length).toFixed(1)}
                </Text>{' '}
                nas atividades restantes, você passa.
              </Text>
            )}
          </View>
        )}

        {temDados && (
          <View style={styles.resumo}>
            <ResumoLinha label="Pontos garantidos" valor={`${garantidos.toFixed(0)} pts`} estilos={styles} />
            <Divisor estilos={styles} />
            <ResumoLinha label="Pontos em jogo" valor={`${emJogo.toFixed(0)} pts`} estilos={styles} />
            <Divisor estilos={styles} />
            <ResumoLinha label="Meta de aprovação" valor={`${meta.toFixed(0)} pts`} estilos={styles} />
          </View>
        )}

        {temDados && status === 'em_jogo' && pendentes.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>ATIVIDADES PENDENTES</Text>
            {pendentes.map((a) => (
              <AtividadePendenteCard
                key={a.id}
                atividade={a}
                minimo={minimoParaAtividade(a)}
                tema={tema}
                estilos={styles}
              />
            ))}
          </View>
        )}

        {temDados && status === 'aprovado' && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>SUAS NOTAS</Text>
            {atividades.map((a) => (
              <View key={a.id} style={styles.atividadeFeita}>
                <View style={styles.atividadeNomeRow}>
                  <Text style={styles.atividadeNome}>{a.nome}</Text>
                  <View style={[styles.tipoBadge, { backgroundColor: a.tipo === 'OAT' ? tema.primaria + '22' : '#a78bfa22' }]}>
                    <Text style={[styles.tipoBadgeText, { color: a.tipo === 'OAT' ? tema.primaria : '#a78bfa' }]}>{a.tipo}</Text>
                  </View>
                </View>
                <Text style={styles.atividadeFeitaNota}>
                  {a.pontos_obtidos !== null ? `${a.pontos_obtidos} / ${a.pontos_maximos} pts` : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos Dinâmicos ────────────────────────────────────────────────────────

const criarEstilos = (tema: CoresTema) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: tema.fundo },
  centered: {
    flex: 1, backgroundColor: tema.fundo,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  erroTexto: { color: tema.erro, fontSize: 14, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  btnVoltar: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: tema.superficie,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: tema.borda,
  },
  headerTitulo: { color: tema.texto, fontSize: 17, fontWeight: '700' },
  headerSub: { color: tema.textoSecundario, fontSize: 12, marginTop: 1 },

  scroll: { padding: 16, paddingBottom: 48, gap: 16 },

  cardDestaque: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  cardEmJogo: {
    backgroundColor: tema.em_jogo + '15',
    borderColor: tema.em_jogo + '40',
  },
  cardAprovado: {
    backgroundColor: tema.aprovado + '15',
    borderColor: tema.aprovado + '40',
  },
  cardReprovado: {
    backgroundColor: tema.reprovado + '15',
    borderColor: tema.reprovado + '40',
  },
  cardNeutro: {
    backgroundColor: tema.superficie,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: tema.borda,
    alignItems: 'flex-start',
    gap: 8,
  },
  cardDestaqueTexto: {
    color: tema.texto,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 8,
  },
  cardDestaqueSubtexto: {
    color: tema.textoSecundario,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },

  semDadosTitulo: { color: tema.texto, fontSize: 20, fontWeight: '700', lineHeight: 28 },
  semDadosLink: { color: tema.primaria, fontSize: 14, marginTop: 4 },

  resumo: {
    backgroundColor: tema.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tema.borda,
    overflow: 'hidden',
  },
  resumoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resumoLabel: { color: tema.textoSecundario, fontSize: 14 },
  resumoValor: { color: tema.texto, fontSize: 14, fontWeight: '600' },
  divisor: { height: 1, backgroundColor: tema.borda, marginHorizontal: 16 },

  secao: { gap: 10 },
  secaoTitulo: {
    color: tema.textoSecundario,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },

  atividadeCard: {
    backgroundColor: tema.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tema.borda,
    padding: 14,
    gap: 10,
  },
  atividadeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  atividadeNomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  atividadeNome: { color: tema.texto, fontSize: 15, fontWeight: '600' },
  tipoBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tipoBadgeText: { fontSize: 10, fontWeight: '700' },
  atividadeMinimo: { color: tema.textoSecundario, fontSize: 13 },
  atividadeMinimoValor: { fontWeight: '700' },

  atividadeBarra: { gap: 4 },
  atividadeBarraFundo: {
    height: 4,
    backgroundColor: tema.borda,
    borderRadius: 4,
    overflow: 'hidden',
  },
  atividadeBarraPreench: {
    height: 4,
    borderRadius: 4,
  },
  atividadeBarraLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  atividadeBarraLabel: { color: tema.textoSecundario, fontSize: 11 },

  atividadeFeita: {
    backgroundColor: tema.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tema.borda,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  atividadeFeitaNota: { color: tema.aprovado, fontSize: 13, fontWeight: '600' },
});