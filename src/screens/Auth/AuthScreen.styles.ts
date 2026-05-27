import { StyleSheet } from "react-native";
import { CoresTema, tipografia } from "../../utils/tema";

export const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    // Layout
    flex: {
      flex: 1,
      backgroundColor: cores.fundo,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 40,
      justifyContent: "center",
    },

    // Cabeçalho
    header: {
      marginBottom: 40,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: cores.primaria,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: cores.primaria,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    iconText: {
      ...tipografia.dmMono,
      fontSize: 20,
    },
    titulo: {
      ...tipografia.dmSansBold,
      fontSize: 32,
      color: cores.texto,
      letterSpacing: -0.5,
      lineHeight: 36,
    },
    subtitulo: {
      ...tipografia.dmSans,
      fontSize: 14,
      color: cores.textoSecundario,
      marginTop: 8,
      lineHeight: 20,
    },

    // Toggle Entrar / Criar conta
    toggleWrapper: {
      flexDirection: "row",
      backgroundColor: cores.toggleFundo,
      borderRadius: 14,
      padding: 4,
      marginBottom: 24,
      position: "relative",
      height: 44,
    },
    togglePill: {
      position: "absolute",
      top: 4,
      width: "48%",
      height: 36,
      backgroundColor: cores.primaria,
      borderRadius: 10,
      shadowColor: cores.primaria,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    toggleBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    toggleLabel: {
      ...tipografia.dmSansBold,
      fontSize: 14,
      color: cores.textoSecundario,
    },
    toggleLabelActive: {
      color: cores.texto,
    },

    // Formulário
    form: {
      gap: 16,
      marginBottom: 4,
    },
    fieldGroup: {
      marginBottom: 4,
    },
    label: {
      ...tipografia.dmSansBold,
      fontSize: 11,
      color: cores.textoSecundario,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    input: {
      ...tipografia.dmSans,
      backgroundColor: cores.inputBg,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 14,
      color: cores.texto,
    },
    inputError: {
      borderColor: cores.erroBorda,
    },
    senhaWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    senhaInput: {
      paddingRight: 48,
    },
    eyeBtn: {
      position: "absolute",
      right: 14,
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
    },
    erroInline: {
      ...tipografia.dmSans,
      fontSize: 12,
      color: cores.erro,
      marginTop: 5,
      marginLeft: 2,
    },

    // Erro geral
    erroGeralBox: {
      backgroundColor: cores.erroFundo,
      borderWidth: 1,
      borderColor: cores.erroBorda,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 12,
      marginBottom: 4,
    },
    erroGeralText: {
      ...tipografia.dmSans,
      fontSize: 13,
      color: cores.erro,
      lineHeight: 18,
    },

    // Botão primário
    btnPrimario: {
      backgroundColor: cores.primaria,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      shadowColor: cores.primaria,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
      minHeight: 52,
    },
    btnDisabled: {
      opacity: 0.55,
    },
    btnPrimarioText: {
      ...tipografia.dmSansBold,
      fontSize: 15,
      color: "#FFFFFF", // Fixado em branco
      letterSpacing: 0.2,
    },

    // Esqueci a senha
    btnEsqueci: {
      marginTop: 16,
      alignItems: "center",
      paddingVertical: 4,
    },
    btnEsqueciText: {
      ...tipografia.dmSans,
      fontSize: 13,
      color: cores.textoDesabilitado,
    },
  });
