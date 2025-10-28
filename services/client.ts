import axios, { AxiosError, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL não definida.");

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let volatileAccessToken: string | null = null;

export function setAccessTokenInMemory(token: string | null) {
  volatileAccessToken = token;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getAccessTokenInMemory() {
  return volatileAccessToken;
}

let httpAbortController = new AbortController();
export function abortAllRequests() {
  try { httpAbortController.abort(); } catch { }
  httpAbortController = new AbortController();
}

let isRefreshing = false;
type QueueItem = {
  resolve: (v?: unknown) => void;
  reject: (e: any) => void;
  config: AxiosRequestConfig & { _retry?: boolean };
};
let queue: QueueItem[] = [];

function processQueue(error: any, token: string | null) {
  queue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.config.headers = { ...(p.config.headers ?? {}) };
      if (token) (p.config.headers as any).Authorization = `Bearer ${token}`;
      else delete (p.config.headers as any).Authorization;
      p.resolve(api.request(p.config));
    }
  });
  queue = [];
}

export function resetAuthQueue() {
  queue.forEach(p => p.reject(new Error("Logout: refresh queue cancelada.")));
  queue = [];
  isRefreshing = false;
}

api.interceptors.request.use(async (config) => {
  config.signal = httpAbortController.signal;

  if (config.headers?.Authorization) return config;

  const token = getAccessTokenInMemory() ?? await SecureStore.getItemAsync("accessToken");

  if (token) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  console.log("API REQUEST:", config.method?.toUpperCase(), config.url, token ? "(with token)" : "(no token)");
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.name === "CanceledError") throw error;

    const original = error?.config;
    const status = error?.response?.status;

    if ((error as any)?.code === "ECONNABORTED") {
      throw new Error("Tempo de requisição esgotado. Tente novamente.");
    }
    if ((error as any)?.code === "ERR_NETWORK") {
      throw new Error("Sem conexão com a internet. Verifique sua rede.");
    }

    if (status === 401 && !original?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject, config: original }));
      }
      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        const currentAccess = getAccessTokenInMemory() ?? await SecureStore.getItemAsync("accessToken");
        if (!refreshToken) throw error;

        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
          ...(currentAccess ? { accessToken: currentAccess } : {}),
        });

        const newAccess: string | undefined =
          data?.accessToken ?? data?.access_token ?? data?.data?.accessToken;
        const newRefresh: string | undefined =
          data?.refreshToken ?? data?.refresh_token ?? data?.data?.refreshToken;

        if (newAccess) {
          await SecureStore.setItemAsync("accessToken", newAccess);
          setAccessTokenInMemory(newAccess);
        }
        if (newRefresh) await SecureStore.setItemAsync("refreshToken", newRefresh);

        processQueue(null, newAccess ?? null);
        return api(original);
      } catch (err) {
        await SecureStore.deleteItemAsync("accessToken").catch(() => {});
        await SecureStore.deleteItemAsync("refreshToken").catch(() => {});
        setAccessTokenInMemory(null);
        processQueue(err, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);