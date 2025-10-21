import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'user_access_token';
const REFRESH_KEY = 'user_refresh_token';


export async function saveTokens(accessToken: string, refreshToken: string) {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(ACCESS_KEY, accessToken);
      window.localStorage.setItem(REFRESH_KEY, refreshToken);
    } else {
      await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
    console.log('Tokens salvos com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar os tokens:', error);
    throw new Error('Não foi possível salvar a sessão do usuário.');
  }
}

export async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  try {
    if (Platform.OS === 'web') {
      return {
        accessToken: window.localStorage.getItem(ACCESS_KEY),
        refreshToken: window.localStorage.getItem(REFRESH_KEY),
      };
    } else {
      const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      return { accessToken, refreshToken };
    }
  } catch (error) {
    console.error('Erro ao buscar os tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
}

export async function deleteTokens() {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
    console.log('Tokens removidos com sucesso.');
  } catch (error) {
    console.error('Erro ao apagar os tokens:', error);
    throw new Error('Não foi possível finalizar a sessão local.');
  }
}