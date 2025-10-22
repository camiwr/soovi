import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { safeGetMe, getMe } from "../services/auth";
import { setAccessTokenInMemory, abortAllRequests, resetAuthQueue } from "../services/client";
import { queryClient } from "../lib/queryClient";

type User = { id: string; name?: string | null; email: string; cpf?: string | null; phone?: string | null; };
type AuthResponseNormalized = { user: User | null; accessToken: string | null; refreshToken: string | null; };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  setSession: (auth: AuthResponseNormalized) => Promise<void>;
  clearSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef(0);
  const bumpSession = () => { sessionRef.current += 1; return sessionRef.current; };

  const setSession = async (auth: AuthResponseNormalized) => {
    abortAllRequests();
    resetAuthQueue();
    const mySession = bumpSession();
    queryClient.clear();

    if (auth.accessToken) await SecureStore.setItemAsync("accessToken", auth.accessToken);
    if (auth.refreshToken) await SecureStore.setItemAsync("refreshToken", auth.refreshToken);

    setAccessTokenInMemory(auth.accessToken ?? null);

    console.log("setSession TOKENS:", auth.accessToken?.slice(0,30), auth.refreshToken?.slice(0,30));

    try {
    const me = auth.accessToken
      ? await safeGetMe(auth.accessToken) 
      : await getMe();                    
    if (sessionRef.current === mySession) setUser(me);
  } catch {
    if (sessionRef.current === mySession) setUser(null);
  }
};

  const clearSession = async () => {
    abortAllRequests();
    resetAuthQueue();
    bumpSession();
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    setAccessTokenInMemory(null); 
    setUser(null);
    queryClient.clear();
    console.log("Sessão limpa");
  };

  const refreshProfile = async () => {
    const mySession = sessionRef.current;
    try {
      const me = await getMe();
      if (sessionRef.current === mySession) setUser(me);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        setAccessTokenInMemory(token ?? null); 
        if (token) await refreshProfile();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo(() => ({ user, loading, setSession, clearSession, refreshProfile }), [user, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};