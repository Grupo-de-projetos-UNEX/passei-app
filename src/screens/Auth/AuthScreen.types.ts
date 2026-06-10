import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

export type AuthNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

export type Mode = 'login' | 'signup';
