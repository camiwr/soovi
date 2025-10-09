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
  password: string; // plain (vamos enviar no campo password no service)
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
      
      // Verifica se a sessão mudou (indicando troca de usuário) APENAS se não estiver em processo de logout
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
      
      // VALIDAÇÃO CRÍTICA: Verifica consistência token/usuário
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
      // Se falhar ao buscar o usuário, limpa tudo
      setUser(null);
      setCurrentSessionId(null);
      await forceDeleteAll();
      throw error;
    }
  };

  // Checa token salvo ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        console.log('=== INICIALIZANDO APP - VERIFICANDO SESSÃO ===');
        
        const token = await getToken();
        const sessionId = await getCurrentSessionId();
        
        console.log('Token encontrado:', !!token);
        console.log('Session ID:', sessionId);
        
        if (token && sessionId) {
          // Se tem token e sessão, tenta validar
          console.log('Token existente encontrado, validando...');
          await refreshMe(true);
        } else {
          // Se não tem token ou sessão, limpa tudo
          console.log('Nenhum token/sessão, limpando tudo...');
          setUser(null);
          setCurrentSessionId(null);
          await forceDeleteAll();
        }
      } catch (error) {
        // Se der erro, garante que o usuário seja null e tudo seja limpo
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
    
    // LIMPEZA COMPLETA E FORÇADA antes de qualquer login
    console.log('Limpando estado antes do login...');
    setUser(null);
    setCurrentSessionId(null);
    await forceDeleteAll();
    
    // Aguarda para garantir limpeza
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let tentativas = 0;
    const maxTentativas = 5; // Aumentei para 5 tentativas
    
    while (tentativas < maxTentativas) {
      try {
        tentativas++;
        console.log(`=== TENTATIVA ${tentativas}/${maxTentativas} ===`);
        
        // Limpeza extra a cada tentativa
        if (tentativas > 1) {
          console.log('Limpeza extra antes da nova tentativa...');
          await forceDeleteAll();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Mais tempo entre tentativas
        }
        
        // Faz o login
        console.log('Executando login no servidor...');
        await loginPassword(email, password);
        
        // Aguarda mais tempo antes de buscar dados do usuário
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Busca dados do usuário
        console.log('Buscando dados do usuário...');
        const userData = await me();
        
        // VALIDAÇÃO RIGOROSA: O email DEVE ser exatamente igual
        if (userData.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
          console.error(`🚨 TENTATIVA ${tentativas}: EMAIL INCORRETO!`);
          console.error('Email esperado:', email.toLowerCase().trim());
          console.error('Email retornado:', userData.email.toLowerCase().trim());
          
          // Se não é a última tentativa, tenta novamente
          if (tentativas < maxTentativas) {
            console.log('Email incorreto, limpando e tentando novamente...');
            await forceDeleteAll();
            continue;
          } else {
            throw new Error(`Servidor retornou usuário incorreto. Esperado: ${email}, Recebido: ${userData.email}`);
          }
        }
        
        // Valida consistência do token também
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
        
        // Se chegou até aqui, está tudo certo
        console.log('✅ Login válido confirmado');
        console.log('Email confirmado:', userData.email);
        console.log('Usuário autenticado:', userData.name);
        
        setUser(userData);
        const newSessionId = await getCurrentSessionId();
        setCurrentSessionId(newSessionId);
        
        console.log('=== LOGIN CONCLUÍDO COM SUCESSO ===');
        return; // Sucesso, sai do loop
        
      } catch (error: any) {
        console.error(`Erro na tentativa ${tentativas}:`, error.message);
        
        // Limpa tudo antes da próxima tentativa
        setUser(null);
        setCurrentSessionId(null);
        await forceDeleteAll();
        
        if (tentativas >= maxTentativas) {
          console.error('❌ Todas as tentativas falharam');
          throw new Error(`Login falhou após ${maxTentativas} tentativas: ${error.message}`);
        }
        
        // Aguarda mais tempo antes da próxima tentativa
        const waitTime = tentativas * 1000; // Aumenta o tempo a cada tentativa
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
      // Primeiro limpa o estado local imediatamente
      setUser(null);
      setCurrentSessionId(null);
      
      // Força logout completo (servidor + local)
      await forceLogoutEverywhere();
      
      console.log('=== LOGOUT CONCLUÍDO ===');
    } catch (error) {
      // Mesmo se der erro, garante que limpa tudo
      console.warn('Erro no logout:', error);
      setUser(null);
      setCurrentSessionId(null);
      await forceDeleteAll();
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
      
      // Aguarda um pouco
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