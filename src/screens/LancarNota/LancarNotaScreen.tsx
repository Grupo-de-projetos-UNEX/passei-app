import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  useColorScheme,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../types/navigation';
import { AtividadesRepository } from '../../lib/repositories/AtividadesRepository';
import { Atividade } from '../../types/domain';
import { temaClaro, temaEscuro, CoresTema } from '../../utils/tema';

type Nav   = StackNavigationProp<RootStackParamList, 'LancarNota'>;
type Route = RouteProp<RootStackParamList, 'LancarNota'>;

export default function LancarNotaScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { atividadeId } = route.params;

  const isDark = useColorScheme() === 'dark';
  const tema   = isDark ? temaEscuro : temaClaro;
  const s      = useMemo(() => criarEstilos(tema), [tema]);

  // ── Estado ───────────────────────────────────────────────────────────────────
  const [atividade, setAtividade]       = useState<Atividade | null>(null);
  const [loadingInit, setLoadingInit]   = useState(true);
  const [errorInit, setErrorInit]       = useState('');
  const [valor, setValor]               = useState('');
  const [erro, setErro]                 = useState('');
  const [salvando, setSalvando]         = useState(false);
  const [limpando, setLimpando]         = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // ── Carrega atividade ────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await AtividadesRepository.getAtividade(atividadeId);
        if (!mounted) return;
        setAtividade(data as unknown as Atividade);
        if (data.pontos_obtidos !== null) setValor(String(data.pontos_obtidos));
      } catch {
        if (mounted) setErrorInit('Não foi possível carregar a atividade.');
      } finally {
        if (mounted) setLoadingInit(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [atividadeId]);

  // Autofocus após carregamento
  useEffect(() => {
    if (!loadingInit && !errorInit && atividade) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [loadingInit, errorInit, atividade]);

  // ── Validação ────────────────────────────────────────────────────────────────
  function validar(): number | null {
    const trimmed = valor.trim().replace(',', '.');
    if (!trimmed) { setErro('Informe um valor numérico.'); return null; }
    const num = parseFloat(trimmed);
    if (isNaN(num)) { setErro('Informe um valor numérico.'); return null; }
    if (num < 0 || num > atividade!.pontos_maximos) {
      setErro(`Valor entre 0 e ${atividade!.pontos_maximos} pts.`);
      return null;
    }
    return num;
  }

  // ── Salvar ───────────────────────────────────────────────────────────────────
  async function handleSalvar() {
    const num = validar();
    if (num === null || !atividade) return;
    setSalvando(true);
    try {
      await AtividadesRepository.lancarNota(atividade.id, num);
      navigation.goBack();
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Limpar nota ──────────────────────────────────────────────────────────────
  function handleLimpar() {
    if (!atividade) return;
    Alert.alert(
      'Limpar nota',
      `Remover a nota de "${atividade.nome}"? A atividade voltará para pendente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            setLimpando(true);
            try {
              await AtividadesRepository.lancarNota(atividade.id, null);
              navigation.goBack();
            } catch {
              setErro('Erro ao limpar a nota.');
            } finally {
              setLimpando(false);
            }
          },
        },
      ]
    );
  }

  // ── Loading / Erro ───────────────────────────────────────────────────────────
  if (loadingInit) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={tema.primaria} size="large" />
      </View>
    );
  }

  if (errorInit || !atividade) {
    return (
      <View style={s.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={tema.erro} />
        <Text style={s.erroTexto}>{errorInit || 'Atividade não encontrada.'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={s.retryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const corTipo      = atividade.tipo === 'OAT' ? tema.primaria : '#a78bfa';
  const temNota      = atividade.pontos_obtidos !== null;
  const desabilitado = !valor.trim() || salvando;

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Overlay fecha o sheet ao tocar fora */}
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => navigation.goBack()}
        />

        {/* Sheet */}
        <View style={s.sheet}>

          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.tituloRow}>
              <Text style={s.titulo}>{atividade.nome}</Text>
              <View style={[s.tipoBadge, { backgroundColor: corTipo + '22' }]}>
                <Text style={[s.tipoBadgeText, { color: corTipo }]}>
                  {atividade.tipo}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={16} color={tema.textoSecundario} />
            </TouchableOpacity>
          </View>

          {/* Subtítulo */}
          <Text style={s.subtitulo}>vale até {atividade.pontos_maximos} pts</Text>

          {/* Input numérico grande */}
          <TextInput
            ref={inputRef}
            style={[s.input, inputFocused && s.inputFocused]}
            value={valor}
            onChangeText={(t) => { setValor(t); setErro(''); }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onSubmitEditing={handleSalvar}
            placeholder="0"
            placeholderTextColor={tema.textoDesabilitado}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
          />

          {/* Erro inline */}
          {!!erro && <Text style={s.erroInline}>{erro}</Text>}

          {/* Botões */}
          <View style={s.botoesContainer}>
            <TouchableOpacity
              style={[s.btnSalvar, desabilitado && s.btnDesabilitado]}
              onPress={handleSalvar}
              disabled={desabilitado}
              activeOpacity={0.8}
            >
              {salvando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnSalvarText}>Salvar</Text>
              }
            </TouchableOpacity>

            {temNota && (
              <TouchableOpacity
                style={s.btnLimpar}
                onPress={handleLimpar}
                disabled={limpando}
                activeOpacity={0.7}
              >
                {limpando
                  ? <ActivityIndicator color={tema.erro} size="small" />
                  : <Text style={s.btnLimparText}>Limpar nota</Text>
                }
              </TouchableOpacity>
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos dinâmicos ─────────────────────────────────────────────────────────
const criarEstilos = (tema: CoresTema) => StyleSheet.create({
  flex:     { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  centered: {
    flex: 1, backgroundColor: tema.fundo,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  erroTexto: { color: tema.erro, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:  { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.borda },
  retryText: { color: tema.primaria, fontSize: 14, fontWeight: '600' },

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
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  tituloRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  titulo:     { fontSize: 16, fontWeight: '700', color: tema.texto },
  tipoBadge:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tipoBadgeText: { fontSize: 10, fontWeight: '700' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: tema.toggleFundo,
    alignItems: 'center', justifyContent: 'center',
  },

  subtitulo: { fontSize: 12, color: tema.textoSecundario, marginBottom: 20 },

  input: {
    backgroundColor: tema.inputBg,
    borderWidth: 1, borderColor: tema.borda,
    borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 20,
    color: tema.texto, fontSize: 40, fontWeight: '700', textAlign: 'center',
    marginBottom: 8,
  },
  inputFocused:  { borderColor: tema.primaria },
  erroInline:    { fontSize: 12, color: tema.erro, textAlign: 'center', marginBottom: 12 },
  botoesContainer: { marginTop: 12, gap: 8 },

  btnSalvar: {
    backgroundColor: tema.primaria, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDesabilitado: { opacity: 0.4 },
  btnSalvarText:   { color: '#fff', fontSize: 15, fontWeight: '700' },

  btnLimpar: {
    paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: tema.erroFundo,
  },
  btnLimparText: { color: tema.erro, fontSize: 14, fontWeight: '600' },
});