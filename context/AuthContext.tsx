import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { deleteTokens, getTokens } from '../lib/session';
import {
  createUser,
  loginPassword,
  logout,
  me,
  updateUser,
} from '../services/auth';
import { SignUpInput, User } from '../types/auth';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInPassword: (email: string, password: string) => Promise<void>;
  signUpWithCustom: (p: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (payload: { name?: string; phone?: string }) => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);
export const useAuth = () => useContext(Ctx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkUserSession() {
    setLoading(true);
    try {
      const { accessToken } = await getTokens(); 
      if (accessToken) {                         
        const userData = await me();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn('Falha ao verificar sessão inicial (pode ser normal):', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkUserSession();
  }, []);

  const signInPassword = async (email: string, password: string) => {
    try {
      await deleteTokens();
      setUser(null);
      await loginPassword(email, password);
      const userData = await me();
      setUser(userData);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Falha no processo de login:', error.message);
      await deleteTokens();
      setUser(null);
      throw error;
    }
  };

  const signUpWithCustom = async (p: SignUpInput) => {
    await createUser(p);
    await signInPassword(p.email, p.password);
  };

  const signOut = async () => {
    try {
      setUser(null);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error("Erro durante o signOut. Forçando limpeza local:", error);
      await deleteTokens();
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  const updateProfile = async (payload: { name?: string; phone?: string }) => {
    if (!user?.id) return;
    try {
      const updatedUser = await updateUser(user.id, payload);
      setUser(updatedUser);
    } catch (error) {
       console.error("Erro ao atualizar perfil:", error);
       throw error;
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        signInPassword,
        signUpWithCustom,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};