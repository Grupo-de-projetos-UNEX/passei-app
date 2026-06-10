import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { MateriasRepository } from '../../lib/repositories';
import { AuthRepository } from '../../lib/repositories';
import { cores } from '../../utils/tema';

type Props = NativeStackScreenProps<RootStackParamList, 'AdicionarMateria'>;

export default function AdicionarMateriaScreen({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSalvar() {
    if (!nome.trim()) {
      Alert.alert('Campo obrigatório', 'Digite o nome da matéria.');
      return;
    }

    setCarregando(true);
    try {
      const user = await AuthRepository.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      await MateriasRepository.createMateria({
        user_id: user.id,
        nome: nome.trim(),
      });

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Não foi possível salvar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.sheet}>
        <Text style={styles.titulo}>Nova matéria</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex: Cálculo I"
          placeholderTextColor={cores.textoSecundario}
          value={nome}
          onChangeText={setNome}
          autoFocus
          maxLength={60}
        />

        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={handleSalvar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Adicionar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoCancelar} onPress={() => navigation.goBack()}>
          <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: cores.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.fundo,
  },
  botao: {
    backgroundColor: cores.primaria,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  botaoCancelar: {
    alignItems: 'center',
    padding: 8,
  },
  botaoCancelarTexto: {
    color: cores.textoSecundario,
    fontSize: 15,
  },
});