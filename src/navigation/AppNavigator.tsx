import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { RootStackParamList } from "../types/navigation";
import { AuthRepository } from "../lib/repositories";

import AuthScreen from "../screens/Auth/AuthScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import AdicionarMateriaScreen from "../screens/AdicionarMateria/AdicionarMateriaScreen";
import DetalheMateriaScreen from "../screens/DetalheMateria/DetalheMateriaScreen";
import LancarNotaScreen from "../screens/LancarNota/LancarNotaScreen";
import EditarAtividadesScreen from "../screens/EditarAtividades/EditarAtividadesScreen";
import QuantoPrecisoScreen from "../screens/QuantoPreciso/QuantoPrecisoScreen";
import ConfiguracoesScreen from "../screens/Configuracoes/ConfiguracoesScreen";

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [session, setSession] = useState<boolean | null>(null);
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    AuthRepository.getSession().then((s) => setSession(!!s));

    const { data: listener } = AuthRepository.onAuthStateChange(
      async (_event, s) => {
         console.log('onAuthStateChange disparou:', _event, !!s);
        setSession(!!s);
        if (!s) {
          // sessão encerrada → manda pra Auth independente de onde estiver
          navRef.current?.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          });
        } else {
          // login feito → manda pra Home
          navRef.current?.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#111113", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navRef}>
      <Stack.Navigator
        initialRouteName={session ? "Home" : "Auth"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AdicionarMateria" component={AdicionarMateriaScreen} />
        <Stack.Screen name="DetalheMateria" component={DetalheMateriaScreen} />
        <Stack.Screen name="LancarNota" component={LancarNotaScreen} />
        <Stack.Screen name="EditarAtividades" component={EditarAtividadesScreen} />
        <Stack.Screen name="QuantoPreciso" component={QuantoPrecisoScreen} />
        <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}