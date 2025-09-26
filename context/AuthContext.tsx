import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken } from '../lib/session';
import {
  loginPassword,
  createUser,
  me,
  logout as apiLogout,
  updateUser,
  type User,
} from '../services/auth';

type SignUpInput = {
  name: string;
  email: string;
  password: string; // plain (vamos enviar no campo password_hash no service)
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
};

const Ctx = createContext<AuthCtx>({} as any);
export const useAuth = () => useContext(Ctx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const u = await me();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  // Checa token salvo ao abrir o app
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        await refreshMe();
      } else {
        setUser(null);
      }
      setLoading(false);
    })();
  }, []);

  const signInPassword = async (email: string, password: string) => {
    await loginPassword(email, password); 
    await refreshMe();
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
    await apiLogout();
    setUser(null);
  };

  const updateProfile = async (payload: { name?: string; phone?: string }) => {
    if (!user?.id) return;
    const u = await updateUser(user.id, payload);
    setUser(u);
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
      }}
    >
      {children}
    </Ctx.Provider>
  );
};