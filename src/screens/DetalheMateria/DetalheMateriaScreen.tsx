import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import {
  MateriasRepository,
  AtividadesRepository,
  AuthRepository,
  ProfileRepository,
} from '../../lib/repositories';
import { Materia, Atividade } from '../../types/domain';
import {
  calcularStatus,
  calcularPontosGarantidos,
  calcularMeta,
} from '../../utils/calculos';
import { corDoStatus, temaEscuro } from '../../utils/tema';

const tema = temaEscuro;

type Props = NativeStackScreenProps<RootStackParamList, 'DetalheMateria'>;

export default function DetalheMateriaScreen({ route, navigation }: Props) {
  const { materiaId } = route.params;
  const [materia, setMateria] = useState<Materia | null>(null);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [percentualAprovacao, setPercentualAprovacao] = useState(70);
  const [carregando, setCarregando] = useState(true);

  // Bottom sheet state
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null);
  const [valorNota, setValorNota] = useState('');
  const [erroNota, setErroNota] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        setCarregando(true);
        try {
          const user = await AuthRepository.getUser();
          if (!user) return;
          const [m, a, profile] = await Promise.all([
            MateriasRepository.getMateria(materiaId),
            AtividadesRepository.listAtividades(materiaId),
            ProfileRepository.getProfile(user.id),
          ]);
          setMateria(m);
          setAtividades(a);
          setPercentualAprovacao(profile.percentual_aprovacao ?? 70);
        } catch (err: any) {
          Alert.alert('Erro', err.message);
        } finally {
          setCarregando(false);
        }
      }
      carregar();
    }, [materiaId])
  );

  async function recarregarAtividades() {
    try {
      const a = await AtividadesRepository.listAtividades(materiaId);
      setAtividades(a);
    } catch {
      // silently ignore
    }
  }

  function abrirSheet(atividade: Atividade) {
    setAtividadeSelecionada(atividade);
    setValorNota(atividade.pontos_obtidos !== null ? String(atividade.pontos_obtidos) : '');
    setErroNota('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function fecharSheet() {
    setAtividadeSelecionada(null);
    setValorNota('');
    setErroNota('');
  }

  function validarNota(): number | null {
    if (!atividadeSelecionada) return null;
    const trimmed = valorNota.trim().replace(',', '.');
    if (!trimmed) { setErroNota('Informe um valor numérico.'); return null; }
    const num = parseFloat(trimmed);
    if (isNaN(num)) { setErroNota('Informe um valor numérico.'); return null; }
    if (num < 0 || num > atividadeSelecionada.pontos_maximos) {
      setErroNota(`Valor entre 0 e ${atividadeSelecionada.pontos_maximos} pts.`);
      return null;
    }
    return num;
  }

  async function handleSalvar() {
    const num = validarNota();
    if (num === null || !atividadeSelecionada) return;
    setSalvando(true);
    try {
      await AtividadesRepository.lancarNota(atividadeSelecionada.id, num);
      fecharSheet();
      await recarregarAtividades();
    } catch {
      setErroNota('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleLimpar() {
    if (!atividadeSelecionada) return;
    setLimpando(true);
    try {
      await AtividadesRepository.lancarNota(atividadeSelecionada.id, null);
      fecharSheet();
      await recarregarAtividades();
    } catch {
      setErroNota('Erro ao limpar a nota.');
    } finally {
      setLimpando(false);
    }
  }

  if (carregando) {
    return (
      <View style={[styles.centralizador, { backgroundColor: tema.fundo }]}>
        <ActivityIndicator size="large" color={tema.primaria} />
      </View>
    );
  }

  if (!materia) return null;

  const status = calcularStatus(atividades, percentualAprovacao);
  const corStatus = corDoStatus(status);
  const pontosGarantidos = calcularPontosGarantidos(atividades);
  const meta = calcularMeta(percentualAprovacao);
  const progresso = meta > 0 ? Math.min(pontosGarantidos / meta, 1) : 0;
  const percentualDaMeta = Math.round(progresso * 100);

  const lancadas = atividades.filter((a) => a.pontos_obtidos !== null).length;
  const pendentes = atividades.filter((a) => a.pontos_obtidos === null).length;

  const labelStatus: Record<typeof status, string> = {
    aprovado: 'Aprovado',
    em_jogo: 'Em jogo',
    reprovado: 'Reprovado',
    sem_dados: 'Sem dados',
  };

  const iconeStatus: Record<typeof status, string> = {
    aprovado: '✓',
    em_jogo: '⚠',
    reprovado: '✕',
    sem_dados: '—',
  };

  const corTipoAtividade = (tipo: string) =>
    tipo === 'OAT' ? tema.primaria : '#a78bfa';

  const temNota = atividadeSelecionada?.pontos_obtidos !== null;
  const desabilitado = !valorNota.trim() || salvando;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoIcone}>
          <Ionicons name="chevron-back" size={24} color={tema.texto} />
        </TouchableOpacity>
        <Text style={styles.nomeTitulo}>{materia.nome}</Text>
        <TouchableOpacity
          style={styles.botaoIcone}
          onPress={() => navigation.navigate('EditarAtividades', { materiaId: materia.id })}
        >
          <Ionicons name="create-outline" size={22} color={tema.texto} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={atividades}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* Card de resumo */}
            <View style={styles.cardResumo}>
              <View style={styles.cardTopo}>
                <Text style={styles.labelGarantidos}>PONTOS GARANTIDOS</Text>
                <View style={[styles.badgeStatus, { backgroundColor: corStatus + '22' }]}>
                  <Text style={[styles.badgeStatusTexto, { color: corStatus }]}>
                    {iconeStatus[status]} {labelStatus[status]}
                  </Text>
                </View>
              </View>
              <View style={styles.pontosRow}>
                <Text style={[styles.pontosNumero, { color: corStatus }]}>
                  {Math.round(pontosGarantidos)}
                </Text>
                <Text style={styles.pontosTotal}> / {Math.round(meta)}</Text>
              </View>
              <View style={styles.progressoBg}>
                <View
                  style={[
                    styles.progressoFill,
                    { width: `${progresso * 100}%` as any, backgroundColor: corStatus },
                  ]}
                />
              </View>
              <View style={styles.cardRodape}>
                <Text style={styles.cardRodapeTexto}>
                  {lancadas} lançada{lancadas !== 1 ? 's' : ''} · {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.cardRodapeTexto}>{percentualDaMeta}% da meta</Text>
              </View>
            </View>

            {/* Botão Quanto preciso? */}
            <TouchableOpacity
              style={styles.botaoQuantoPreciso}
              onPress={() => navigation.navigate('QuantoPreciso', { materia, percentualAprovacao })}
              activeOpacity={0.85}
            >
              <Ionicons name="calculator-outline" size={20} color="#fff" />
              <Text style={styles.botaoQuantoPrecisoTexto}>Quanto preciso?</Text>
            </TouchableOpacity>

            <Text style={styles.secaoTitulo}>ATIVIDADES</Text>
          </>
        }
        renderItem={({ item }) => {
          const corTipo = corTipoAtividade(item.tipo);
          return (
            <TouchableOpacity style={styles.atividadeItem} onPress={() => abrirSheet(item)}>
              <View style={styles.atividadeEsquerda}>
                <View style={styles.atividadeNomeRow}>
                  <Text style={styles.atividadeNome}>{item.nome}</Text>
                  <View style={[styles.tipoBadge, { backgroundColor: corTipo + '22' }]}>
                    <Text style={[styles.tipoBadgeTexto, { color: corTipo }]}>{item.tipo}</Text>
                  </View>
                </View>
                <Text style={styles.atividadeMaximos}>{item.pontos_maximos} pts máximos</Text>
              </View>
              <View style={styles.atividadeDireita}>
                {item.pontos_obtidos !== null ? (
                  <Text style={styles.pontosObtidos}>
                    <Text style={styles.pontosObtidosNum}>{item.pontos_obtidos}</Text>
                    <Text style={styles.pontosObtidosDen}>/{item.pontos_maximos}</Text>
                  </Text>
                ) : (
                  <View style={styles.pendenteRow}>
                    <Ionicons name="time-outline" size={14} color={tema.textoSecundario} />
                    <Text style={styles.pendenteTexto}>pendente</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Bottom sheet de lançar nota */}
      <Modal
        visible={!!atividadeSelecionada}
        transparent
        animationType="slide"
        onRequestClose={fecharSheet}
      >
        <KeyboardAvoidingView
          style={styles.modalFlex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={fecharSheet} />

          {atividadeSelecionada && (
            <View style={styles.sheet}>
              {/* Header do sheet */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTituloRow}>
                  <Text style={styles.sheetTitulo}>{atividadeSelecionada.nome}</Text>
                  <View
                    style={[
                      styles.tipoBadge,
                      { backgroundColor: corTipoAtividade(atividadeSelecionada.tipo) + '22' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tipoBadgeTexto,
                        { color: corTipoAtividade(atividadeSelecionada.tipo) },
                      ]}
                    >
                      {atividadeSelecionada.tipo}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={fecharSheet}>
                  <Ionicons name="close" size={16} color={tema.textoSecundario} />
                </TouchableOpacity>
              </View>

              {/* Subtítulo */}
              <Text style={styles.sheetSubtitulo}>
                {materia.nome} · vale até {atividadeSelecionada.pontos_maximos} pts
              </Text>

              {/* Input numérico */}
              <TextInput
                ref={inputRef}
                style={[styles.notaInput, erroNota ? styles.notaInputErro : null]}
                value={valorNota}
                onChangeText={(t) => { setValorNota(t); setErroNota(''); }}
                onSubmitEditing={handleSalvar}
                placeholder="0"
                placeholderTextColor={tema.textoDesabilitado}
                keyboardType="decimal-pad"
                returnKeyType="done"
                selectTextOnFocus
              />

              {!!erroNota && <Text style={styles.erroInline}>{erroNota}</Text>}

              {/* Botões */}
              <TouchableOpacity
                style={[styles.btnSalvar, desabilitado && styles.btnDesabilitado]}
                onPress={handleSalvar}
                disabled={desabilitado}
                activeOpacity={0.85}
              >
                {salvando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnSalvarTexto}>Salvar</Text>
                }
              </TouchableOpacity>

              {temNota && (
                <TouchableOpacity
                  style={styles.btnLimpar}
                  onPress={handleLimpar}
                  disabled={limpando}
                  activeOpacity={0.7}
                >
                  {limpando
                    ? <ActivityIndicator color={tema.erro} size="small" />
                    : <Text style={styles.btnLimparTexto}>Limpar nota</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tema.fundo },
  centralizador: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Cabeçalho
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: tema.fundo,
  },
  botaoIcone: { padding: 8 },
  nomeTitulo: { fontSize: 17, fontWeight: '700', color: tema.texto, flex: 1, textAlign: 'center' },

  // Card de resumo
  cardResumo: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: tema.superficie,
    borderRadius: 16,
    padding: 16,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelGarantidos: {
    fontSize: 11,
    fontWeight: '600',
    color: tema.textoSecundario,
    letterSpacing: 0.8,
  },
  badgeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeStatusTexto: { fontSize: 12, fontWeight: '700' },
  pontosRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  pontosNumero: { fontSize: 52, fontWeight: '700', lineHeight: 56 },
  pontosTotal: { fontSize: 22, fontWeight: '400', color: tema.texto, opacity: 0.6 },
  progressoBg: {
    height: 5,
    backgroundColor: tema.borda,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressoFill: { height: '100%', borderRadius: 3 },
  cardRodape: { flexDirection: 'row', justifyContent: 'space-between' },
  cardRodapeTexto: { fontSize: 12, color: tema.textoSecundario },

  // Botão Quanto preciso?
  botaoQuantoPreciso: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: tema.primaria,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoQuantoPrecisoTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Seção atividades
  secaoTitulo: {
    fontSize: 12,
    fontWeight: '600',
    color: tema.textoSecundario,
    marginHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.8,
  },

  // Item de atividade
  atividadeItem: {
    backgroundColor: tema.superficie,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atividadeEsquerda: { flex: 1, gap: 4 },
  atividadeNomeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  atividadeNome: { fontSize: 15, fontWeight: '600', color: tema.texto },
  tipoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tipoBadgeTexto: { fontSize: 10, fontWeight: '700' },
  atividadeMaximos: { fontSize: 12, color: tema.textoSecundario },
  atividadeDireita: { alignItems: 'flex-end' },
  pontosObtidos: {},
  pontosObtidosNum: { fontSize: 20, fontWeight: '700', color: tema.texto },
  pontosObtidosDen: { fontSize: 14, color: tema.textoSecundario },
  pendenteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendenteTexto: { fontSize: 13, color: tema.textoSecundario },

  // Modal / Bottom sheet
  modalFlex: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: tema.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: tema.borda,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  sheetTitulo: { fontSize: 16, fontWeight: '700', color: tema.texto },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tema.toggleFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubtitulo: { fontSize: 12, color: tema.textoSecundario, marginBottom: 20 },
  notaInput: {
    backgroundColor: tema.inputBg,
    borderWidth: 1,
    borderColor: tema.borda,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    color: tema.texto,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  notaInputErro: { borderColor: tema.erro },
  erroInline: { fontSize: 12, color: tema.erro, textAlign: 'center', marginBottom: 12 },
  btnSalvar: {
    backgroundColor: tema.primaria,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnDesabilitado: { opacity: 0.4 },
  btnSalvarTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnLimpar: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnLimparTexto: { color: tema.textoSecundario, fontSize: 14 },
});
