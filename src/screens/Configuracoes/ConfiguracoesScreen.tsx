import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { AuthRepository } from "../../lib/repositories";
import { temaClaro, temaEscuro } from "../../utils/tema";
import { criarEstilos } from "./ConfiguracoesScreen.styles";

interface UserProfile {
  nome: string;
  email: string;
  metaAprovacao: number;
}

export default function ConfiguracoesScreen() {
  const navigation = useNavigation();

  // ── Tema Responsivo ─────────────────────────────────────────────────────────
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const coresAtuais = isDark ? temaEscuro : temaClaro;
  const styles = useMemo(() => criarEstilos(coresAtuais), [coresAtuais]);

  // ── Estados ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [savingSlider, setSavingSlider] = useState(false);
  const [usuario, setUsuario] = useState<UserProfile | null>(null);
  const [percentual, setPercentual] = useState(70);

  // ── Buscar dados do Supabase ao montar a tela ───────────────────────────────
  useEffect(() => {
    async function carregarPerfil() {
      try {
        setLoading(true);
        // Exemplo profissional buscando do seu repositório mapeado com Supabase
        // Se o seu método for diferente (ex: AuthRepository.getSession), adapte aqui
        const session = await AuthRepository.getSession();

        if (session?.user) {
          setUsuario({
            nome: session.user.user_metadata?.nome || "Usuário",
            email: session.user.email || "seu@email.com",
            metaAprovacao: session.user.user_metadata?.meta_aprovacao ?? 70,
          });
          setPercentual(session.user.user_metadata?.meta_aprovacao ?? 70);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    }

    carregarPerfil();
  }, []);

  // ── Salvar nova meta no Supabase ao soltar o Slider ────────────────────────
  async function handleSalvarMeta(valor: number) {
    try {
      setSavingSlider(true);

      // Removemos o "as any" e chamamos direto!
      await AuthRepository.updateProfile({ meta_aprovacao: valor });

      setPercentual(valor);
    } catch (error) {
      console.error(error); // Mantém para ver no terminal se algo der errado
      Alert.alert("Erro", "Não foi possível salvar sua nova meta no banco.");
      if (usuario) setPercentual(usuario.metaAprovacao);
    } finally {
      setSavingSlider(false);
    }
  }

  // ── Tratar Ação de Logout ───────────────────────────────────────────────────
  function handleSair() {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await AuthRepository.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: "Auth" as never }],
            });
          } catch (error) {
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
            <View style={styles.profileItem}>
              <Text style={styles.itemLabel}>Nome</Text>
              <Text style={styles.itemValue}>{usuario?.nome}</Text>
            </View>
            <View style={styles.divisor} />
            <View style={styles.profileItem}>
              <Text style={styles.itemLabel}>Email</Text>
              <Text style={styles.itemValueRegular}>{usuario?.email}</Text>
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
              Usado como meta para novas matérias. Matérias existentes mantêm o
              percentual que já têm.
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
