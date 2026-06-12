import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { AuthRepository, ProfileRepository } from "../../lib/repositories";
import { temaClaro, temaEscuro } from "../../utils/tema";
import { criarEstilos } from "./ConfiguracoesScreen.styles";

export default function ConfiguracoesScreen() {
  const navigation = useNavigation();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const coresAtuais = isDark ? temaEscuro : temaClaro;
  const styles = useMemo(() => criarEstilos(coresAtuais), [coresAtuais]);

  const [loading, setLoading] = useState(true);
  const [savingNome, setSavingNome] = useState(false);
  const [savingSlider, setSavingSlider] = useState(false);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [nomeSalvo, setNomeSalvo] = useState("");
  const [percentual, setPercentual] = useState(70);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        setLoading(true);
        const user = await AuthRepository.getUser();
        if (!user) return;

        setUserId(user.id);
        setEmail(user.email ?? "");

        const profile = await ProfileRepository.getProfile(user.id);
        setNome(profile.nome ?? "");
        setNomeSalvo(profile.nome ?? "");
        setPercentual(profile.percentual_aprovacao ?? 70);
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    }
    carregarPerfil();
  }, []);

  async function handleSalvarNome() {
    if (!nome.trim()) {
      Alert.alert("Campo obrigatório", "O nome não pode ficar vazio.");
      return;
    }
    try {
      setSavingNome(true);
      await ProfileRepository.updateProfile(userId, { nome: nome.trim() });
      setNomeSalvo(nome.trim());
      setNome(nome.trim());
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o nome.");
    } finally {
      setSavingNome(false);
    }
  }

  async function handleSalvarMeta(valor: number) {
    try {
      setSavingSlider(true);
      await ProfileRepository.updateProfile(userId, {
        percentual_aprovacao: valor,
      });
      setPercentual(valor);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar sua nova meta.");
    } finally {
      setSavingSlider(false);
    }
  }

  function handleSair() {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await AuthRepository.signOut();
          } catch {
            Alert.alert("Erro", "Não foi possível deslogar. Tente novamente.");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={coresAtuais.primaria} />
      </View>
    );
  }

  const nomeAlterado = nome.trim() !== nomeSalvo;

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de navegação superior */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={coresAtuais.texto}
            />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Configurações</Text>
        </View>

        {/* SEÇÃO: PERFIL */}
        <View style={styles.secao}>
          <Text style={styles.secaoLabel}>Perfil</Text>
          <View style={styles.card}>
            {/* Nome editável */}
            <View style={styles.profileItemRow}>
              <View style={styles.profileItemLeft}>
                <Text style={styles.itemLabel}>Nome</Text>
                <TextInput
                  style={styles.nomeInput}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Seu nome"
                  placeholderTextColor={coresAtuais.textoDesabilitado}
                  returnKeyType="done"
                  onSubmitEditing={nomeAlterado ? handleSalvarNome : undefined}
                />
              </View>
              {nomeAlterado && (
                <TouchableOpacity
                  style={styles.nomeSaveBtn}
                  onPress={handleSalvarNome}
                  disabled={savingNome}
                  activeOpacity={0.8}
                >
                  {savingNome ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.nomeSaveBtnText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divisor} />

            <View style={styles.profileItem}>
              <Text style={styles.itemLabel}>Email</Text>
              <Text style={styles.itemValueRegular}>{email}</Text>
            </View>
          </View>
        </View>

        {/* SEÇÃO: PREFERÊNCIAS */}
        <View style={styles.secao}>
          <Text style={styles.secaoLabel}>Preferências</Text>
          <View style={[styles.card, styles.sliderCard]}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderTitle}>Percentual de aprovação</Text>
              {savingSlider ? (
                <ActivityIndicator size="small" color={coresAtuais.primaria} />
              ) : (
                <Text style={styles.sliderValue}>{percentual}%</Text>
              )}
            </View>

            <Text style={styles.sliderDescription}>
              Usado como meta para todas as matérias.
            </Text>

            <Slider
              style={styles.sliderComponent}
              minimumValue={50}
              maximumValue={100}
              step={1}
              value={percentual}
              onValueChange={setPercentual}
              onSlidingComplete={handleSalvarMeta}
              minimumTrackTintColor={coresAtuais.primaria}
              maximumTrackTintColor={coresAtuais.borda}
              thumbTintColor={coresAtuais.primaria}
            />

            <View style={styles.sliderLabelsRow}>
              <Text style={styles.sliderLabelText}>50%</Text>
              <Text style={styles.sliderLabelText}>75%</Text>
              <Text style={styles.sliderLabelText}>100%</Text>
            </View>
          </View>
        </View>

        {/* SEÇÃO: CONTA */}
        <View style={styles.secao}>
          <Text style={styles.secaoLabel}>Conta</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleSair}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEÇÃO: SOBRE */}
        <View style={styles.secao}>
          <Text style={styles.secaoLabel}>Sobre</Text>
          <View style={styles.card}>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>Versão</Text>
              <Text style={styles.versionValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
