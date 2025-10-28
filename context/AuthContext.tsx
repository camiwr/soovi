import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { safeGetMe, getMe } from "@/services/auth";
import { setAccessTokenInMemory, abortAllRequests, resetAuthQueue } from "@/services/client";
import { queryClient } from "@/lib/queryClient";

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

  const setSession = useCallback(async (auth: AuthResponseNormalized) => {
    abortAllRequests();
    resetAuthQueue();
    const mySession = bumpSession();
    queryClient.clear();

    if (auth.accessToken) await SecureStore.setItemAsync("accessToken", auth.accessToken);
    if (auth.refreshToken) await SecureStore.setItemAsync("refreshToken", auth.refreshToken);

    setAccessTokenInMemory(auth.accessToken ?? null);

    try {
      const me = auth.accessToken
        ? await safeGetMe(auth.accessToken) // primeira carga pós-login
        : await getMe();                    // via interceptor, token em memória
      if (sessionRef.current === mySession) setUser(me);
    } catch {
      if (sessionRef.current === mySession) setUser(null);
    }
  }, []);

  const clearSession = useCallback(async () => {
    abortAllRequests();
    resetAuthQueue();
    bumpSession();
    await SecureStore.deleteItemAsync("accessToken").catch(() => {});
    await SecureStore.deleteItemAsync("refreshToken").catch(() => {});
    setAccessTokenInMemory(null);
    setUser(null);
    queryClient.clear();
  }, []);

  const refreshProfile = useCallback(async () => {
    const mySession = sessionRef.current;
    try {
      const me = await getMe();
      if (sessionRef.current === mySession) setUser(me);
    } catch {}
  }, []);

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
  }, [refreshProfile]);

  const value = useMemo(
    () => ({ user, loading, setSession, clearSession, refreshProfile }),
    [user, loading, setSession, clearSession, refreshProfile]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
