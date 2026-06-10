import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthRepository } from "../../lib/repositories";
import { AuthNavigationProp, Mode } from "./AuthScreen.types";
import { temaClaro, temaEscuro } from "../../utils/tema";
import { criarEstilos } from "./AuthScreen.styles";

export default function AuthScreen() {
  const navigation = useNavigation<AuthNavigationProp>();

  // ── Tema Responsivo ─────────────────────────────────────────────────────────
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const coresAtuais = isDark ? temaEscuro : temaClaro;
  const styles = useMemo(() => criarEstilos(coresAtuais), [coresAtuais]);

  // ── Estados ─────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const [erroNome, setErroNome] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroGeral, setErroGeral] = useState("");

  const toggleAnim = useRef(new Animated.Value(0)).current;
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function switchMode(m: Mode) {
    setMode(m);
    limparErros();
    Animated.timing(toggleAnim, {
      toValue: m === "login" ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }

  function limparErros() {
    setErroNome("");
    setErroEmail("");
    setErroSenha("");
    setErroGeral("");
  }

  function validar(): boolean {
    let ok = true;
    limparErros();

    if (mode === "signup" && !nome.trim()) {
      setErroNome("Informe seu nome.");
      ok = false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErroEmail("E-mail inválido.");
      ok = false;
    }
    if (senha.length < 6) {
      setErroSenha("Senha precisa ter ao menos 6 caracteres.");
      ok = false;
    }
    return ok;
  }

  async function handleSubmit() {
    if (!validar()) return;
    setLoading(true);
    setErroGeral("");
    try {
      if (mode === "login") {
        await AuthRepository.signIn(email.trim(), senha);
      } else {
        await AuthRepository.signUp(email.trim(), senha, nome.trim());
      }
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.includes("Invalid login credentials")) {
        setErroGeral("E-mail ou senha incorretos.");
      } else if (msg.includes("User already registered")) {
        setErroGeral("Este e-mail já está cadastrado.");
      } else if (msg.includes("Email not confirmed")) {
        setErroGeral("Confirme seu e-mail antes de entrar.");
      } else {
        setErroGeral(msg || "Algo deu errado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEsqueciSenha() {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErroEmail("Informe um e-mail válido acima para redefinir a senha.");
      return;
    }
    setLoadingReset(true);
    try {
      await AuthRepository.resetPassword(email.trim());
      Alert.alert(
        "E-mail enviado",
        "Verifique sua caixa de entrada para redefinir a senha.",
        [{ text: "OK" }],
      );
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o e-mail. Tente novamente.");
    } finally {
      setLoadingReset(false);
    }
  }

  // ── Interpolações ───────────────────────────────────────────────────────────
  const pillLeft = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "50%"],
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll} // Aqui a mágica da centralização acontece
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📖</Text>
          </View>
          <Text style={styles.titulo}>Passei</Text>
          <Text style={styles.subtitulo}>
            Saiba quantos pontos você precisa para passar.
          </Text>
        </View>

        {/* Toggle Entrar / Criar conta */}
        <View style={styles.toggleWrapper}>
          <Animated.View style={[styles.togglePill, { left: pillLeft }]} />
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => switchMode("login")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleLabel,
                mode === "login" && styles.toggleLabelActive,
              ]}
            >
              Entrar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => switchMode("signup")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleLabel,
                mode === "signup" && styles.toggleLabelActive,
              ]}
            >
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          {mode === "signup" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>NOME</Text>
              <TextInput
                style={[styles.input, !!erroNome && styles.inputError]}
                placeholder="Seu nome"
                placeholderTextColor={coresAtuais.textoSecundario}
                value={nome}
                onChangeText={(v) => {
                  setNome(v);
                  if (erroNome) setErroNome("");
                }}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                autoCapitalize="words"
                autoComplete="name"
              />
              {!!erroNome && <Text style={styles.erroInline}>{erroNome}</Text>}
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, !!erroEmail && styles.inputError]}
              placeholder="seu@email.com"
              placeholderTextColor={coresAtuais.textoSecundario}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (erroEmail) setErroEmail("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => senhaRef.current?.focus()}
            />
            {!!erroEmail && <Text style={styles.erroInline}>{erroEmail}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>SENHA</Text>
            <View style={styles.senhaWrapper}>
              <TextInput
                ref={senhaRef}
                style={[
                  styles.input,
                  styles.senhaInput,
                  !!erroSenha && styles.inputError,
                ]}
                placeholder="••••••"
                placeholderTextColor={coresAtuais.textoSecundario}
                value={senha}
                onChangeText={(v) => {
                  setSenha(v);
                  if (erroSenha) setErroSenha("");
                }}
                secureTextEntry={!showSenha}
                autoCapitalize="none"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowSenha((p) => !p)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {/* --- ÍCONE PADRÃO EM VEZ DE EMOJI --- */}
                <MaterialCommunityIcons
                  name={showSenha ? "eye-off" : "eye"}
                  size={22}
                  color={coresAtuais.textoSecundario}
                />
              </TouchableOpacity>
            </View>
            {!!erroSenha && <Text style={styles.erroInline}>{erroSenha}</Text>}
          </View>
        </View>

        {!!erroGeral && (
          <View style={styles.erroGeralBox}>
            <Text style={styles.erroGeralText}>{erroGeral}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnPrimario, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.btnPrimarioText}>
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Text>
          )}
        </TouchableOpacity>

        {mode === "login" && (
          <TouchableOpacity
            style={styles.btnEsqueci}
            onPress={handleEsqueciSenha}
            disabled={loadingReset}
            activeOpacity={0.7}
          >
            {loadingReset ? (
              <ActivityIndicator
                size="small"
                color={coresAtuais.textoDesabilitado}
              />
            ) : (
              <Text style={styles.btnEsqueciText}>Esqueci minha senha</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
