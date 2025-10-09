import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'user_token';
const SESSION_KEY = 'session_id';

// Gera um ID único para cada sessão
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function saveToken(token: string) {
  try {
    console.log('=== SALVANDO NOVO TOKEN ===');
    
    // Primeiro, limpa TUDO antes de salvar novo token
    await forceDeleteAll();
    
    // Aguarda um pouco para garantir limpeza
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Gera um novo ID de sessão para isolar completamente
    const sessionId = generateSessionId();
    const timestamp = Date.now().toString();
    
    if (Platform.OS === 'web') {
      window.localStorage.setItem(ACCESS_KEY, token);
      window.localStorage.setItem(SESSION_KEY, sessionId);
      window.localStorage.setItem('token_timestamp', timestamp);
    } else {
      await SecureStore.setItemAsync(ACCESS_KEY, token);
      await SecureStore.setItemAsync(SESSION_KEY, sessionId);
      await SecureStore.setItemAsync('token_timestamp', timestamp);
    }
    console.log('Nova sessão criada:', sessionId, 'em', new Date().toISOString());
    console.log('Token salvo (primeiros 20 chars):', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Erro ao salvar token:', error);
    throw error;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    let token;
    if (Platform.OS === 'web') {
      token = window.localStorage.getItem(ACCESS_KEY);
    } else {
      token = await SecureStore.getItemAsync(ACCESS_KEY);
    }
    
    if (token) {
      console.log('Token encontrado (primeiros 20 chars):', token.substring(0, 20) + '...');
    } else {
      console.log('Nenhum token encontrado');
    }
    
    return token;
  } catch (error) {
    console.error('Erro ao buscar token:', error);
    return null;
  }
}

export async function getCurrentSessionId(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return window.localStorage.getItem(SESSION_KEY);
    } else {
      return await SecureStore.getItemAsync(SESSION_KEY);
    }
  } catch (error) {
    console.error('Erro ao buscar session ID:', error);
    return null;
  }
}

// Força a limpeza COMPLETA de todos os dados de sessão
export async function forceDeleteAll() {
  try {
    console.log('🧹 Iniciando limpeza completa...');
    
    if (Platform.OS === 'web') {
      // Limpa TODAS as chaves relacionadas ao app
      const keysToRemove = [ACCESS_KEY, SESSION_KEY, 'token_timestamp'];
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key);
        } catch {}
      });
      
      // Força limpeza de possíveis outras chaves antigas
      const storage = window.localStorage;
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key && (key.includes('user') || key.includes('token') || key.includes('session') || key.includes('auth'))) {
          try {
            storage.removeItem(key);
            console.log('Removido:', key);
          } catch {}
        }
      }
    } else {
      // Limpa SecureStore
      const keysToRemove = [ACCESS_KEY, SESSION_KEY, 'token_timestamp'];
      for (const key of keysToRemove) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log('Removido do SecureStore:', key);
        } catch {}
      }
    }
    
    // Verifica se realmente foi limpo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const tokenCheck = await getToken();
    if (tokenCheck) {
      console.error('⚠️ Token ainda existe após limpeza! Forçando remoção...');
      // Força novamente
      if (Platform.OS === 'web') {
        window.localStorage.clear();
      } else {
        try {
          await SecureStore.deleteItemAsync(ACCESS_KEY);
        } catch {}
      }
    }
    
    console.log('✅ Limpeza completa de sessão executada em', new Date().toISOString());
  } catch (error) {
    console.error('Erro na limpeza completa:', error);
  }
}

export async function deleteToken() {
  await forceDeleteAll();
}

// Função para debugar o estado atual do storage
export async function debugStorage() {
  console.log('=== DEBUG STORAGE ===');
  try {
    if (Platform.OS === 'web') {
      console.log('LocalStorage contents:');
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const value = window.localStorage.getItem(key);
          console.log(`${key}: ${value}`);
        }
      }
    } else {
      console.log('SecureStore - checking known keys:');
      const keys = [ACCESS_KEY, SESSION_KEY, 'token_timestamp'];
      for (const key of keys) {
        try {
          const value = await SecureStore.getItemAsync(key);
          console.log(`${key}: ${value || 'null'}`);
        } catch (e) {
          console.log(`${key}: error reading`);
        }
      }
    }
  } catch (error) {
    console.error('Erro no debug storage:', error);
  }
  console.log('=== FIM DEBUG STORAGE ===');
}

// Valida se o token e usuário são consistentes
export async function validateTokenUserConsistency(userEmail: string): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const tokenEmail = payload.email;
    
    console.log('Validação token/usuário:');
    console.log('Email do usuário:', userEmail);
    console.log('Email no token:', tokenEmail);
    
    const isValid = tokenEmail?.toLowerCase().trim() === userEmail?.toLowerCase().trim();
    
    if (!isValid) {
      console.error('🚨 INCONSISTÊNCIA DETECTADA NA VALIDAÇÃO!');
      console.error('Token email:', tokenEmail);
      console.error('User email:', userEmail);
    }
    
    return isValid;
  } catch (error) {
    console.error('Erro na validação token/usuário:', error);
    return false;
  }
}

// Nova função para extrair email do token sem validar
export async function getEmailFromToken(): Promise<string | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return null;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    return payload.email || null;
  } catch (error) {
    console.error('Erro ao extrair email do token:', error);
    return null;
  }
}
