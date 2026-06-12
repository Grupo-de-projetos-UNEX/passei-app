import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { Materia, Atividade, StatusMateria } from '../../types/domain';
import { RootStackParamList } from '../../types/navigation';
import {
  calcularStatus,
  calcularPontosGarantidos,
  calcularMeta,
  calcularPontosEmJogo,
} from '../../utils/calculos';

// ─── Importação dos Temas ──────────────────────────────────────────────────────
import { temaClaro, temaEscuro, CoresTema } from '../../utils/tema';

// ─── Tipos internos ────────────────────────────────────────────────────────────
type MateriaComStatus = Materia & {
  status: StatusMateria;
  pontosObtidos: number;
  pontosMaximos: number;
  atividadesPendentes: number;
  percentualAprovacao: number;
};

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;

// ─── Config visual dinâmica de cada status ─────────────────────────────────────

const getStatusConfig = (status: StatusMateria, tema: CoresTema) => {
  const metaMsg = (m: MateriaComStatus) => {
    const meta = calcularMeta(m.percentualAprovacao);
    const faltam = Math.max(0, Math.ceil(meta - m.pontosObtidos));
    return `Faltam ${faltam} pts em ${m.atividadesPendentes} atividade${m.atividadesPendentes !== 1 ? 's' : ''}`;
  };

  const configBase = {
    aprovado: { label: 'Aprovado', icon: 'checkmark-circle' as const, cor: tema.aprovado, msg: () => 'Você passou ✓' },
    em_jogo: { label: 'Em jogo', icon: 'warning' as const, cor: tema.em_jogo, msg: metaMsg },
    reprovado: { label: 'Reprovado', icon: 'close-circle' as const, cor: tema.reprovado, msg: () => 'Sem possibilidade pelo regular' },
    sem_dados: { label: 'Sem dados', icon: 'time-outline' as const, cor: tema.sem_dados, msg: () => 'Lance uma nota para calcular' },
  };

  const cfg = configBase[status];
  
  return {
    ...cfg,
    bgColor: status === 'sem_dados' ? tema.superficie : cfg.cor + '15',
    barColor: status === 'sem_dados' ? tema.borda : cfg.cor,
  };
};

// ─── Componente MateriaCard ────────────────────────────────────────────────────

const MateriaCard = React.memo(
  ({ 
    item, 
    onPress, 
    onQuantoPreciso, 
    tema, 
    estilos 
  }: {
    item: MateriaComStatus;
    onPress: () => void;
    onQuantoPreciso: () => void;
    tema: CoresTema;
    estilos: ReturnType<typeof criarEstilos>;
  }) => {
    const cfg = getStatusConfig(item.status, tema);

    const meta = calcularMeta(item.percentualAprovacao);
    const progresso = item.pontosMaximos > 0
        ? Math.min(1, item.pontosObtidos / item.pontosMaximos)
        : 0;
    const marcadorPos = item.pontosMaximos > 0
        ? Math.min(100, (meta / item.pontosMaximos) * 100)
        : 70;

    return (
      <TouchableOpacity style={estilos.card} onPress={onPress} activeOpacity={0.72}>
        <View style={estilos.cardHeader}>
          <Text style={estilos.cardNome} numberOfLines={1}>
            {item.nome}
          </Text>
          <View style={[estilos.badge, { backgroundColor: cfg.bgColor }]}>
            <Ionicons
              name={cfg.icon}
              size={12}
              color={cfg.cor}
              style={{ marginRight: 4 }}
            />
            <Text style={[estilos.badgeText, { color: cfg.cor }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        <View style={estilos.barraContainer}>
          <View style={estilos.barraFundo}>
            <View
              style={[
                estilos.barraPreenchimento,
                { width: `${progresso * 100}%`, backgroundColor: cfg.barColor },
              ]}
            />
            <View
              style={[
                estilos.marcadorMeta,
                { left: `${marcadorPos}%` as any },
              ]}
            />
          </View>
        </View>
        <View style={estilos.cardFooter}>
          <Text style={[estilos.pontos, { color: cfg.cor }]}>
            <Text style={estilos.pontosValor}>{item.pontosObtidos}</Text>
            <Text style={estilos.pontosMeta}> / {item.pontosMaximos} pts</Text>
          </Text>
          <Text style={estilos.mensagem} numberOfLines={1}>
            {cfg.msg(item)}
          </Text>
        </View>
        {/* <TouchableOpacity
          onPress={onQuantoPreciso}
          style={{ marginTop: 8, alignSelf: 'flex-start' }}
        >
          <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '600' }}>
            Quanto preciso? →
          </Text>
        </TouchableOpacity> */}
      </TouchableOpacity>
    );
  },
);

// ─── Tela principal ────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  
  // ── Tema Dinâmico ──
  const isDark = useColorScheme() === 'dark';
  const tema = isDark ? temaEscuro : temaClaro;
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [materias, setMaterias] = useState<MateriaComStatus[]>();
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setErro(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigation.replace('Auth');
        return;
      }

      const [profileRes, materiasRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('nome, percentual_aprovacao')
          .eq('id', user.id)
          .single(),
        supabase
          .from('materias')
          .select('*, atividades(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
      ]);

      if (profileRes.data?.nome) {
        setNomeUsuario(profileRes.data.nome);
      }

      if (materiasRes.error) throw materiasRes.error;

      const percentualAprovacao = profileRes.data?.percentual_aprovacao ?? 70;

      const processadas: MateriaComStatus[] = (materiasRes.data ?? []).map(
        (m: any) => {
          const atividades: Atividade[] = m.atividades ?? [];
          const status = calcularStatus(atividades, percentualAprovacao);
          const pontosObtidos = calcularPontosGarantidos(atividades);
          const pontosMaximos = atividades.reduce(
            (acc, a) => acc + a.pontos_maximos,
            0,
          );
          const atividadesPendentes = atividades.filter(
            (a) => a.pontos_obtidos === null,
          ).length;

          const { atividades: _drop, ...materiaLimpa } = m;

          return {
            ...materiaLimpa,
            status,
            pontosObtidos,
            pontosMaximos,
            atividadesPendentes,
            percentualAprovacao,
          } as MateriaComStatus;
        },
      );

      setMaterias(processadas);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar os dados.');
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      carregarDados().finally(() => setLoading(false));
    }, [carregarDados]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  }, [carregarDados]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tema.primaria} />
      </View>
    );
  }

  // ── Erro ─────────────────────────────────────────────────────────────────────

  if (erro) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={42} color={tema.erro} />
        <Text style={styles.erroTexto}>{erro}</Text>
        <TouchableOpacity
          style={styles.btnRetry}
          onPress={() => {
            setLoading(true);
            carregarDados().finally(() => setLoading(false));
          }}
        >
          <Text style={styles.btnRetryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={tema.fundo} />

      <FlatList
        data={materias}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tema.primaria}
            colors={[tema.primaria]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.saudacao}>
                Olá, {nomeUsuario || 'aluna'}
              </Text>
              <Text style={styles.titulo}>Suas matérias</Text>
            </View>
            <TouchableOpacity
              style={styles.btnConfig}
              onPress={() => navigation.navigate('Configuracoes')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={21} color={tema.textoSecundario} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="book-outline" size={52} color={tema.borda} />
            <Text style={styles.vazioTexto}>Nenhuma matéria ainda</Text>
            <Text style={styles.vazioSub}>Toque no + para adicionar</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MateriaCard
            item={item}
            tema={tema}
            estilos={styles}
            onPress={() => navigation.navigate('DetalheMateria', { materiaId: item.id })}
            onQuantoPreciso={() => navigation.navigate('QuantoPreciso', { materia: item, percentualAprovacao: item.percentualAprovacao })}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AdicionarMateria')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Estilos Dinâmicos ────────────────────────────────────────────────────────

const criarEstilos = (tema: CoresTema) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tema.fundo,
  },
  centered: {
    flex: 1,
    backgroundColor: tema.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  erroTexto: {
    color: tema.erro,
    fontSize: 14,
    textAlign: 'center',
  },
  btnRetry: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: tema.superficie,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tema.borda,
  },
  btnRetryText: {
    color: tema.primaria,
    fontWeight: '600',
    fontSize: 14,
  },

  lista: {
    paddingHorizontal: 16,
    paddingBottom: 100, 
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 24,
  },
  saudacao: {
    color: tema.textoSecundario,
    fontSize: 13,
    marginBottom: 2,
  },
  titulo: {
    color: tema.texto,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  btnConfig: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tema.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tema.borda,
    marginTop: 4,
  },

  card: {
    backgroundColor: tema.superficie,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tema.borda,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardNome: {
    color: tema.texto,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  barraContainer: {
    marginBottom: 10,
  },
  barraFundo: {
    height: 4,
    backgroundColor: tema.borda,
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  barraPreenchimento: {
    height: 4,
    borderRadius: 4,
  },
  marcadorMeta: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 10,
    backgroundColor: tema.textoDesabilitado,
    borderRadius: 1,
    transform: [{ translateX: -1 }],
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pontos: {
    fontSize: 13,
  },
  pontosValor: {
    fontWeight: '700',
    fontSize: 14,
  },
  pontosMeta: {
    fontWeight: '400',
    color: tema.textoSecundario,
    fontSize: 13,
  },
  mensagem: {
    color: tema.textoSecundario,
    fontSize: 12,
    flexShrink: 1,
    marginLeft: 8,
    textAlign: 'right',
  },

  vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    gap: 8,
  },
  vazioTexto: {
    color: tema.textoSecundario,
    fontSize: 15,
    fontWeight: '600',
  },
  vazioSub: {
    color: tema.textoDesabilitado,
    fontSize: 13,
  },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tema.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tema.primaria,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
});