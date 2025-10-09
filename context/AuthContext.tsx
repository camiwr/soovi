import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { forceDeleteAll, getCurrentSessionId, getToken, validateTokenUserConsistency } from '../lib/session';
import {
  createUser,
  forceLogoutEverywhere,
  loginPassword,
  me,
  updateUser,
  type User
} from '../services/auth';

type SignUpInput = {
  name: string;
  email: string;
  password: string; 
  cpf?: string;
  phone?: string;
  type?: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInPassword: (email: string, password: string) => Promise<void>;
  signUpWithCustom: (p: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (payload: { name?: string; phone?: string }) => Promise<void>;
  forceRefresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);
export const useAuth = () => useContext(Ctx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false);

  const refreshMe = async (forceValidation = false) => {
    try {
      const token = await getToken();
      const sessionId = await getCurrentSessionId();
      
      if (!token) {
        console.log('Nenhum token encontrado, limpando estado');
        setUser(null);
        setCurrentSessionId(null);
        return;
      }
      
      if (currentSessionId && sessionId !== currentSessionId && !forceValidation && !isLogoutInProgress) {
        console.log('Sessão alterada detectada, limpando estado...');
        setUser(null);
        setCurrentSessionId(null);
        await forceDeleteAll();
        return;
      }
      
      console.log('Buscando dados do usuário...');
      const u = await me();
      console.log('Usuário encontrado:', u.email);
      
      const isConsistent = await validateTokenUserConsistency(u.email);
      if (!isConsistent) {
        console.error('🚨 INCONSISTÊNCIA DETECTADA!');
        console.error('Token e usuário não correspondem');
        console.error('Forçando logout e nova autenticação...');
        
        setUser(null);
        setCurrentSessionId(null);
        await forceDeleteAll();
        throw new Error('Inconsistência entre token e usuário. Faça login novamente.');
      }
      
      console.log('✅ Validação de consistência passou');
      setUser(u);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setUser(null);
      setCurrentSessionId(null);
      await forceDeleteAll();
      throw error;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        console.log('=== INICIALIZANDO APP - VERIFICANDO SESSÃO ===');
        
        const token = await getToken();
        const sessionId = await getCurrentSessionId();
        
        console.log('Token encontrado:', !!token);
        console.log('Session ID:', sessionId);
        
        if (token && sessionId) {
          console.log('Token existente encontrado, validando...');
          await refreshMe(true);
        } else {
          console.log('Nenhum token/sessão, limpando tudo...');
          setUser(null);
          setCurrentSessionId(null);
          await forceDeleteAll();
        }
      } catch (error) {
        console.warn('Erro ao validar token inicial:', error);
        setUser(null);
        setCurrentSessionId(null);
        await forceDeleteAll();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signInPassword = async (email: string, password: string) => {
    console.log('=== INICIANDO LOGIN ===');
    console.log('Email alvo:', email);
    
    console.log('Limpando estado antes do login...');
    setUser(null);
    setCurrentSessionId(null);
    await forceDeleteAll();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let tentativas = 0;
    const maxTentativas = 5;
    
    while (tentativas < maxTentativas) {
      try {
        tentativas++;
        console.log(`=== TENTATIVA ${tentativas}/${maxTentativas} ===`);
        
        if (tentativas > 1) {
          console.log('Limpeza extra antes da nova tentativa...');
          await forceDeleteAll();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('Executando login no servidor...');
        await loginPassword(email, password);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Buscando dados do usuário...');
        const userData = await me();
        
        if (userData.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
          console.error(`🚨 TENTATIVA ${tentativas}: EMAIL INCORRETO!`);
          console.error('Email esperado:', email.toLowerCase().trim());
          console.error('Email retornado:', userData.email.toLowerCase().trim());
          
          if (tentativas < maxTentativas) {
            console.log('Email incorreto, limpando e tentando novamente...');
            await forceDeleteAll();
            continue;
          } else {
            throw new Error(`Servidor retornou usuário incorreto. Esperado: ${email}, Recebido: ${userData.email}`);
          }
        }
        
        const isValid = await validateTokenUserConsistency(userData.email);
        
        if (!isValid) {
          console.error(`🚨 TENTATIVA ${tentativas}: Token inconsistente detectado`);
          
          if (tentativas < maxTentativas) {
            console.log('Token inconsistente, limpando e tentando novamente...');
            await forceDeleteAll();
            continue;
          } else {
            throw new Error('Token inconsistente após múltiplas tentativas');
          }
        }
        
        console.log('✅ Login válido confirmado');
        console.log('Email confirmado:', userData.email);
        console.log('Usuário autenticado:', userData.name);
        
        setUser(userData);
        const newSessionId = await getCurrentSessionId();
        setCurrentSessionId(newSessionId);
        
        console.log('=== LOGIN CONCLUÍDO COM SUCESSO ===');
        return;
        
      } catch (error: any) {
        console.error(`Erro na tentativa ${tentativas}:`, error.message);
        
        setUser(null);
        setCurrentSessionId(null);
        await forceDeleteAll();
        
        if (tentativas >= maxTentativas) {
          console.error('❌ Todas as tentativas falharam');
          throw new Error(`Login falhou após ${maxTentativas} tentativas: ${error.message}`);
        }
        
        const waitTime = tentativas * 1000;
        console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  const signUpWithCustom = async (p: SignUpInput) => {
    await createUser({
      name: p.name,
      email: p.email,
      password: p.password, 
      cpf: p.cpf,
      phone: p.phone,
      type: p.type,
    });
    await signInPassword(p.email, p.password);
  };

  const signOut = async () => {
    console.log('=== INICIANDO LOGOUT ===');
    setIsLogoutInProgress(true);

    try {
      // 1. Limpa o estado da aplicação IMEDIATAMENTE.
      setUser(null);
      setCurrentSessionId(null);

      // 2. Força a limpeza completa (servidor + local)
      await forceLogoutEverywhere();

      // 3. Redireciona para a tela de login de forma absoluta
      router.replace('/(auth)/login');

      console.log('=== LOGOUT CONCLUÍDO E REDIRECIONADO ===');
    } catch (error) {
      console.warn('Erro no processo de logout, garantindo limpeza local:', error);
      // Mesmo em caso de erro, garante que o estado local e o storage sejam limpos
      setUser(null);
      setCurrentSessionId(null);
      await forceDeleteAll();
      router.replace('/(auth)/login');
    } finally {
      setIsLogoutInProgress(false);
    }
  };

  const updateProfile = async (payload: { name?: string; phone?: string }) => {
    if (!user?.id) return;
    const u = await updateUser(user.id, payload);
    setUser(u);
  };

  const forceRefresh = async () => {
    console.log('=== FORÇANDO REFRESH COMPLETO ===');
    setLoading(true);
    try {
      await forceDeleteAll();
      setUser(null);
      setCurrentSessionId(null);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = await getToken();
      const sessionId = await getCurrentSessionId();
      
      if (token && sessionId) {
        await refreshMe(true);
      }
    } catch (error) {
      console.error('Erro no force refresh:', error);
      setUser(null);
      setCurrentSessionId(null);
    } finally {
      setLoading(false);
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
        refreshMe,
        updateProfile,
        forceRefresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};