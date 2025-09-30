import { useAuth } from '../context/AuthContext';
import { getToken } from '../lib/session';

export function useTokenManager() {
  const { refreshMe, signOut } = useAuth();

  const handleTokenError = async () => {
    try {
      // Tenta renovar o token fazendo uma nova requisição /me
      await refreshMe();
    } catch (error) {
      // Se falhar, faz logout
      console.log('Token inválido, fazendo logout...');
      await signOut();
    }
  };

  const executeWithAuth = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }
      return await fn();
    } catch (error: any) {
      if (error?.status === 401) {
        await handleTokenError();
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      throw error;
    }
  };

  return { executeWithAuth };
}