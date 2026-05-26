import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { RootStackParamList } from "../types/navigation";
import { AuthRepository } from "../lib/repositories";

import AuthScreen from "../screens/Auth/AuthScreen";
import ConfiguracoesScreen from "../screens/Configuracoes/ConfiguracoesScreen";

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    AuthRepository.getSession().then((s) => {
      setSession(!!s);
    });

    const { data: listener } = AuthRepository.onAuthStateChange(
      async (_event, s) => {
        setSession(!!s);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (session === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={session ? "Configuracoes" : "Auth"}
        screenOptions={{ headerShown: false }}
      >
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
