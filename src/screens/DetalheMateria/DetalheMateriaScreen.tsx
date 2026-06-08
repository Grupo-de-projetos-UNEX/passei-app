import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { MateriasRepository, AtividadesRepository } from '../../lib/repositories';
import { Materia, Atividade } from '../../types/domain';
import { calcularStatus, calcularQuantoPrecisa } from '../../utils/calculos';
import { corDoStatus, cores } from '../../utils/tema';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalheMateria'>;

export default function DetalheMateriaScreen({ route, navigation }: Props) {
  const { materiaId } = route.params;
  const [materia, setMateria] = useState<Materia | null>(null);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        setCarregando(true);
        try {
          const [m, a] = await Promise.all([
            MateriasRepository.getMateria(materiaId),
            AtividadesRepository.listAtividades(materiaId),
          ]);
          setMateria(m);
          setAtividades(a);
        } catch (err: any) {
          Alert.alert('Erro', err.message);
        } finally {
          setCarregando(false);
        }
      }
      carregar();
    }, [materiaId])
  );

  if (carregando) {
    return (
      <View style={styles.centralizador}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  if (!materia) return null;

  const status = calcularStatus(atividades, materia.percentual_aprovacao);
  const quantoPrecisa = calcularQuantoPrecisa(atividades, materia.percentual_aprovacao);
  const corStatus = corDoStatus(status);

  const labelStatus: Record<typeof status, string> = {
    aprovado: '✅ Aprovado',
    em_jogo: '⚠️ Em jogo',
    reprovado: '❌ Reprovado',
    sem_dados: '📊 Sem dados ainda',
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltar}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.nomeTitulo}>{materia.nome}</Text>
      </View>

      {/* Card de resumo */}
      <View style={[styles.cardResumo, { borderLeftColor: corStatus }]}>
        <Text style={[styles.statusTexto, { color: corStatus }]}>
          {labelStatus[status]}
        </Text>
        {status !== 'aprovado' && status !== 'sem_dados' && (
          <Text style={styles.metaTexto}>
            Você ainda precisa de{' '}
            <Text style={{ fontWeight: '700' }}>{quantoPrecisa.toFixed(1)} pts</Text>
          </Text>
        )}
        {status === 'aprovado' && (
          <Text style={styles.metaTexto}>Parabéns, você já garantiu a aprovação! 🎉</Text>
        )}
      </View>

      {/* Lista de atividades */}
      <Text style={styles.secaoTitulo}>Atividades</Text>
      <FlatList
        data={atividades}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.atividadeItem}
            onPress={() =>
              navigation.navigate('LancarNota', {
                atividadeId: item.id,
                materiaId: materia.id,
              })
            }
          >
            <View style={styles.atividadeInfo}>
              <Text style={styles.atividadeNome}>{item.nome}</Text>
              <Text style={styles.atividadeTipo}>{item.tipo}</Text>
            </View>
            <View style={styles.atividadePontos}>
              {item.pontos_obtidos !== null ? (
                <Text style={styles.pontosObtidos}>
                  {item.pontos_obtidos}/{item.pontos_maximos}
                </Text>
              ) : (
                <Text style={styles.pontosPendente}>
                  —/{item.pontos_maximos}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Botões de ação */}
      <View style={styles.rodape}>
        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => navigation.navigate('EditarAtividades', { materiaId: materia.id })}
        >
          <Text style={styles.botaoSecundarioTexto}>Editar atividades</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoPrincipal}
          onPress={() => navigation.navigate('QuantoPreciso', { materia })}
        >
          <Text style={styles.botaoPrincipalTexto}>Quanto preciso?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centralizador: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cabecalho: {
    backgroundColor: cores.superficie,
    padding: 20,
    paddingTop: 56,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  voltar: { color: cores.primaria, fontSize: 15 },
  nomeTitulo: { fontSize: 24, fontWeight: '700', color: cores.texto },
  cardResumo: {
    margin: 16,
    backgroundColor: cores.superficie,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 5,
    gap: 4,
  },
  statusTexto: { fontSize: 17, fontWeight: '700' },
  metaTexto: { fontSize: 14, color: cores.textoSecundario },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.textoSecundario,
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  atividadeItem: {
    backgroundColor: cores.superficie,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atividadeInfo: { gap: 2 },
  atividadeNome: { fontSize: 15, fontWeight: '600', color: cores.texto },
  atividadeTipo: { fontSize: 12, color: cores.textoSecundario },
  atividadePontos: {},
  pontosObtidos: { fontSize: 15, fontWeight: '700', color: cores.aprovado },
  pontosPendente: { fontSize: 15, color: cores.textoSecundario },
  rodape: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: cores.superficie,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  botaoPrincipal: {
    flex: 1,
    backgroundColor: cores.primaria,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  botaoPrincipalTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botaoSecundario: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: cores.primaria,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  botaoSecundarioTexto: { color: cores.primaria, fontWeight: '600', fontSize: 15 },
});