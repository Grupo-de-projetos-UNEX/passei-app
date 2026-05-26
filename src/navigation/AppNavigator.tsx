import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { RootStackParamList } from '../types/navigation';
import AuthScreen from '../screens/Auth/AuthScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import AdicionarMateriaScreen from '../screens/AdicionarMateria/AdicionarMateriaScreen';
import DetalheMateriaScreen from '../screens/DetalheMateria/DetalheMateriaScreen';
import LancarNotaScreen from '../screens/LancarNota/LancarNotaScreen';
import EditarAtividadesScreen from '../screens/EditarAtividades/EditarAtividadesScreen';
import QuantoPrecisoScreen from '../screens/QuantoPreciso/QuantoPrecisoScreen';
import ConfiguracoesScreen from '../screens/Configuracoes/ConfiguracoesScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
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
