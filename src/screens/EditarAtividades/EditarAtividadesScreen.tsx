import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../types/navigation';
import { AtividadesRepository } from '../../lib/repositories/AtividadesRepository';
import { Atividade, TipoAtividade } from '../../types/domain';
import { temaClaro, temaEscuro, CoresTema } from '../../utils/tema';

type Nav   = StackNavigationProp<RootStackParamList, 'EditarAtividades'>;
type Route = RouteProp<RootStackParamList, 'EditarAtividades'>;

type AtividadeEditavel = Atividade & { pontosTexto: string };

export default function EditarAtividadesScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { materiaId } = route.params;

  const isDark = useColorScheme() === 'dark';
  const tema   = isDark ? temaEscuro : temaClaro;
  const s      = useMemo(() => criarEstilos(tema), [tema]);

  const [atividades, setAtividades]           = useState<AtividadeEditavel[]>([]);
  const [loadingInit, setLoadingInit]         = useState(true);
  const [errorInit, setErrorInit]             = useState('');
  const [salvando, setSalvando]               = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoadingInit(true);
    setErrorInit('');
    try {
      const data = await AtividadesRepository.listAtividades(materiaId);
      setAtividades(
        (data as unknown as Atividade[]).map((a) => ({
          ...a,
          pontosTexto: String(a.pontos_maximos),
        }))
      );
    } catch {
      setErrorInit('Não foi possível carregar as atividades.');
    } finally {
      setLoadingInit(false);
    }
  }, [materiaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const total = atividades.reduce((soma, a) => {
    const v = parseFloat(a.pontosTexto.replace(',', '.'));
    return soma + (isNaN(v) ? 0 : v);
  }, 0);

  const somaValida = Math.abs(total - 100) < 0.001;
  const tudoValido = somaValida && atividades.every(
    (a) => a.nome.trim().length > 0 && parseFloat(a.pontosTexto.replace(',', '.')) > 0
  );

  function atualizar(id: string, patch: Partial<AtividadeEditavel>) {
    setAtividades((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function tentarRemover(id: string) {
    const ativ = atividades.find((a) => a.id === id);
    if (!ativ) return;
    if (ativ.pontos_obtidos !== null) {
      setConfirmRemoveId(id);
    } else {
      setAtividades((prev) => prev.filter((a) => a.id !== id));
    }
  }

  function confirmarRemocao() {
    if (!confirmRemoveId) return;
    setAtividades((prev) => prev.filter((a) => a.id !== confirmRemoveId));
    setConfirmRemoveId(null);
  }

  function adicionarAtividade() {
    const nova: AtividadeEditavel = {
      id:             `novo-${Date.now()}`,
      materia_id:     materiaId,
      nome:           'Nova atividade',
      tipo:           'OAT',
      pontos_maximos: 10,
      pontos_obtidos: null,
      ordem:          atividades.length + 1,
      data_prevista:  null,
      created_at:     '',
      updated_at:     '',
      pontosTexto:    '10',
    };
    setAtividades((prev) => [...prev, nova]);
  }

  async function handleSalvar() {
    if (!tudoValido) return;
    setSalvando(true);
    try {
      const existentes = atividades.filter((a) => !a.id.startsWith('novo-'));
      await Promise.all(
        existentes.map((a, idx) =>
          AtividadesRepository.updateAtividade(a.id, {
            nome:           a.nome.trim(),
            tipo:           a.tipo,
            pontos_maximos: parseFloat(a.pontosTexto.replace(',', '.')),
            ordem:          idx + 1,
          })
        )
      );
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (loadingInit) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.centered}>
          <ActivityIndicator color={tema.primaria} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (errorInit) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={tema.erro} />
          <Text style={s.erroTexto}>{errorInit}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={carregar}>
            <Text style={s.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ativRemover = atividades.find((a) => a.id === confirmRemoveId);

  return (
    <SafeAreaView style={s.safeArea}>

      {}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={tema.texto} />
        </TouchableOpacity>

        <Text style={s.headerTitulo}>Editar atividades</Text>

        <TouchableOpacity
          style={[s.saveBtn, !tudoValido && s.saveBtnDisabled]}
          onPress={handleSalvar}
          disabled={!tudoValido || salvando}
        >
          {salvando
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.saveBtnText}>Salvar</Text>
          }
        </TouchableOpacity>
      </View>

      {}
      <View style={[s.totalIndicator, somaValida ? s.totalValid : s.totalInvalid]}>
        <Text style={[s.totalTexto, somaValida ? s.totalTextoValid : s.totalTextoInvalid]}>
          Total:{' '}
          <Text style={s.totalNumero}>
            {total % 1 === 0 ? total : total.toFixed(1)}
          </Text>
          {' '}/ 100 pts
        </Text>
        {!somaValida && <Text style={s.totalErroMsg}>Soma deve ser 100</Text>}
      </View>

      {}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {atividades.map((ativ) => (
          <AtividadeItem
            key={ativ.id}
            atividade={ativ}
            tema={tema}
            estilos={s}
            onUpdate={(patch) => atualizar(ativ.id, patch)}
            onRemove={() => tentarRemover(ativ.id)}
          />
        ))}

        <TouchableOpacity style={s.addBtn} onPress={adicionarAtividade} activeOpacity={0.7}>
          <Ionicons name="add" size={16} color={tema.textoSecundario} />
          <Text style={s.addBtnText}>Adicionar atividade</Text>
        </TouchableOpacity>
      </ScrollView>

      {}
      <Modal
        visible={confirmRemoveId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmRemoveId(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitulo}>Remover atividade</Text>
            <Text style={s.modalCorpo}>
              "{ativRemover?.nome}" tem nota lançada. Remover mesmo assim?
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalBtnCancelar}
                onPress={() => setConfirmRemoveId(null)}
              >
                <Text style={s.modalBtnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnRemover} onPress={confirmarRemocao}>
                <Text style={s.modalBtnRemoverText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function AtividadeItem({
  atividade,
  tema,
  estilos: s,
  onUpdate,
  onRemove,
}: {
  atividade: AtividadeEditavel;
  tema: CoresTema;
  estilos: ReturnType<typeof criarEstilos>;
  onUpdate: (patch: Partial<AtividadeEditavel>) => void;
  onRemove: () => void;
}) {
  const [nomeFocused, setNomeFocused]     = useState(false);
  const [pontosFocused, setPontosFocused] = useState(false);

  return (
    <View style={s.itemCard}>
      {}
      <View style={s.itemLinha1}>
        <TextInput
          style={[s.nomeInput, nomeFocused && s.inputFocused]}
          value={atividade.nome}
          onChangeText={(t) => onUpdate({ nome: t })}
          onFocus={() => setNomeFocused(true)}
          onBlur={() => setNomeFocused(false)}
          placeholder="Nome da atividade"
          placeholderTextColor={tema.textoDesabilitado}
          maxLength={40}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={s.removeBtn}
          onPress={onRemove}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="trash-outline" size={16} color={tema.textoSecundario} />
        </TouchableOpacity>
      </View>

      {/* Linha 2: toggle OAT/VA + pontos */}
      <View style={s.itemLinha2}>
        <View style={s.tipoToggle}>
          {(['OAT', 'VA'] as TipoAtividade[]).map((tipo) => {
            const ativo    = atividade.tipo === tipo;
            const corAtivo = tipo === 'OAT' ? tema.primaria : '#a78bfa';
            return (
              <TouchableOpacity
                key={tipo}
                style={[s.tipoBtn, ativo && { backgroundColor: corAtivo }]}
                onPress={() => onUpdate({ tipo })}
                activeOpacity={0.8}
              >
                <Text style={[s.tipoBtnText, ativo ? s.tipoBtnAtivo : s.tipoBtnInativo]}>
                  {tipo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[s.pontosInput, pontosFocused && s.inputFocused]}
          value={atividade.pontosTexto}
          onChangeText={(t) => onUpdate({ pontosTexto: t })}
          onFocus={() => setPontosFocused(true)}
          onBlur={() => {
            setPontosFocused(false);
            const v = parseFloat(atividade.pontosTexto.replace(',', '.'));
            if (!isNaN(v)) onUpdate({ pontos_maximos: v });
          }}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={5}
        />
        <Text style={s.ptsLabel}>pts</Text>
      </View>
    </View>
  );
}

// ── Estilos dinâmicos ─────────────────────────────────────────────────────────
const criarEstilos = (tema: CoresTema) => StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: tema.fundo },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  erroTexto: { color: tema.erro, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:  { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.borda },
  retryText: { color: tema.primaria, fontSize: 14, fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 32) + 8 : 12, paddingBottom: 8,
  },
  backBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.borda,
  },
  headerTitulo: { fontSize: 14, fontWeight: '700', color: tema.texto },
  saveBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: tema.primaria },
  saveBtnDisabled: { opacity: 0.3 },
  saveBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },

  totalIndicator: {
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  totalValid:        { backgroundColor: tema.aprovado + '15', borderColor: tema.aprovado + '40' },
  totalInvalid:      { backgroundColor: tema.erroFundo, borderColor: tema.erroBorda },
  totalTexto:        { fontSize: 12, fontWeight: '600' },
  totalTextoValid:   { color: tema.aprovado },
  totalTextoInvalid: { color: tema.erro },
  totalNumero:       { fontWeight: '700' },
  totalErroMsg:      { fontSize: 11, color: tema.erro, fontWeight: '600' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },

  itemCard: {
    backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.borda,
    borderRadius: 12, padding: 12, gap: 8,
  },
  itemLinha1: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemLinha2: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  nomeInput: {
    flex: 1, backgroundColor: tema.inputBg, borderWidth: 1, borderColor: tema.borda,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    fontSize: 14, color: tema.texto,
  },
  inputFocused: { borderColor: tema.primaria },
  removeBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },

  tipoToggle: {
    flex: 1, flexDirection: 'row',
    backgroundColor: tema.toggleFundo, borderRadius: 8, padding: 2,
  },
  tipoBtn:       { flex: 1, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  tipoBtnText:   { fontSize: 11, fontWeight: '700' },
  tipoBtnAtivo:  { color: '#fff' },
  tipoBtnInativo: { color: tema.textoSecundario },

  pontosInput: {
    width: 60, backgroundColor: tema.inputBg, borderWidth: 1, borderColor: tema.borda,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7,
    fontSize: 14, color: tema.texto, textAlign: 'center',
  },
  ptsLabel: { fontSize: 12, color: tema.textoSecundario },

  addBtn: {
    marginTop: 4, paddingVertical: 14,
    borderWidth: 1, borderStyle: 'dashed', borderColor: tema.borda,
    borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addBtnText: { fontSize: 14, color: tema.textoSecundario },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.70)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: tema.superficie,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: tema.borda,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: tema.texto, marginBottom: 6 },
  modalCorpo:  { fontSize: 14, color: tema.textoSecundario, lineHeight: 20, marginBottom: 24 },
  modalBtns:   { flexDirection: 'row', gap: 12 },
  modalBtnCancelar:     { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: tema.toggleFundo, alignItems: 'center' },
  modalBtnCancelarText: { color: tema.texto, fontSize: 14, fontWeight: '600' },
  modalBtnRemover:      { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: tema.erro, alignItems: 'center' },
  modalBtnRemoverText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
});