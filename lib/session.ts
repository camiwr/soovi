import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'user_token';
// se quiser usar refresh token no futuro:
// const REFRESH_KEY = 'refresh_token';

export async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    try { window.localStorage.setItem(ACCESS_KEY, token); } catch {}
  } else {
    await SecureStore.setItemAsync(ACCESS_KEY, token);
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return window.localStorage.getItem(ACCESS_KEY); } catch { return null; }
  } else {
    try { return await SecureStore.getItemAsync(ACCESS_KEY); } catch { return null; }
  }
}

export async function deleteToken() {
  if (Platform.OS === 'web') {
    try { window.localStorage.removeItem(ACCESS_KEY); } catch {}
  } else {
    try { await SecureStore.deleteItemAsync(ACCESS_KEY); } catch {}
  }
}
