import { StyleSheet, Platform } from "react-native";
import { CoresTema, tipografia } from "../../utils/tema";

export const criarEstilos = (cores: CoresTema) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: cores.fundo,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "ios" ? 20 : 40,
      paddingBottom: 40,
    },

    // Barra de Navegação Superior
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 32,
      height: 48,
    },
    backBtn: {
      padding: 4,
      marginLeft: -4,
      marginRight: 12,
    },
    navTitle: {
      ...tipografia.dmSansBold,
      fontSize: 20,
      color: cores.texto,
    },

    // Estrutura de Seções
    secao: {
      marginBottom: 28,
    },
    secaoLabel: {
      ...tipografia.dmSansBold,
      fontSize: 11,
      color: cores.textoSecundario,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: cores.superficie,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 16,
      paddingVertical: 4,
      overflow: "hidden",
    },

    // Itens de Perfil / Informações fixas
    profileItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    itemLabel: {
      ...tipografia.dmSans,
      fontSize: 12,
      color: cores.textoSecundario,
      marginBottom: 4,
    },
    itemValue: {
      ...tipografia.dmSansBold,
      fontSize: 15,
      color: cores.texto,
    },
    itemValueRegular: {
      ...tipografia.dmSans,
      fontSize: 15,
      color: cores.texto,
    },
    divisor: {
      height: 1,
      backgroundColor: cores.borda,
      marginHorizontal: 16,
    },

    // Slider e Preferências
    sliderCard: {
      padding: 16,
    },
    sliderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sliderTitle: {
      ...tipografia.dmSansBold,
      fontSize: 16,
      color: cores.texto,
    },
    sliderValue: {
      ...tipografia.dmSansBold,
      fontSize: 16,
      color: cores.primaria,
    },
    sliderDescription: {
      ...tipografia.dmSans,
      fontSize: 13,
      color: cores.textoSecundario,
      lineHeight: 18,
      marginBottom: 20,
    },
    sliderComponent: {
      width: "100%",
      height: 40,
    },
    sliderLabelsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      marginTop: -4,
    },
    sliderLabelText: {
      ...tipografia.dmSans,
      fontSize: 11,
      color: cores.textoDesabilitado,
    },

    // Botão de Sair da Conta
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    logoutText: {
      ...tipografia.dmSansBold,
      fontSize: 15,
      color: "#EF4444", // Mantido vermelho padrão de atenção para logout
    },

    // Item de Versão
    versionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    versionLabel: {
      ...tipografia.dmSans,
      fontSize: 15,
      color: cores.textoSecundario,
    },
    versionValue: {
      ...tipografia.dmSans,
      fontSize: 15,
      color: cores.textoDesabilitado,
    },

    // Loading centralizado da tela inteira
    loadingCenter: {
      flex: 1,
      backgroundColor: cores.fundo,
      justifyContent: "center",
      alignItems: "center",
    },
  });
