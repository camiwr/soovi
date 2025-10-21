import { router } from 'expo-router';
import { refreshToken } from '../services/auth';
import { deleteTokens, getTokens, saveTokens } from './session';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;
const TIMEOUT_MS = 15000;

export class HttpError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

type HttpOptions = {
  method?: string;
  body?: any;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

let isRefreshing = false;
let failedQueue: {
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
    options: HttpOptions;
    path: string;
}[] = [];

const processQueue = (error: any | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      request(prom.path, prom.options)
        .then(prom.resolve)
        .catch(prom.reject);
    }
  });
  failedQueue = [];
};

async function handleUnauthorizedLogout() {
  console.warn('Sessão inválida ou expirada. Deslogando usuário.');
  isRefreshing = false; // Garante que resetamos o estado de refresh
  failedQueue = [];     // Limpa a fila
  await deleteTokens();
  router.replace('/(auth)/login');
}

export async function request<T = unknown>(
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  if (!BASE_URL) throw new Error('EXPO_PUBLIC_API_URL não definido.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const signal = options.signal ?? controller.signal;

  const { accessToken } = await getTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...(options.headers || {}),
  };

  if (options.auth) {
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      clearTimeout(timer);
      if (!path.includes('/auth/refresh-token')) {
         handleUnauthorizedLogout();
      }
      throw new HttpError('Sessão não encontrada.', 401, null);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: signal, // Usa o signal correto
    });

    clearTimeout(timer);

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    if (!res.ok) {
      if (res.status === 401 && options.auth && !options.headers?.['X-Retry']) { // Adiciona X-Retry para evitar loop infinito
        console.warn(`Erro 401 interceptado para ${path}. Tentando refresh do token...`);

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await refreshToken();
            const newOptions = { ...options, headers: { ...(options.headers || {}), 'X-Retry': 'true' } };
            processQueue(null);
            return request<T>(path, newOptions); // Tenta novamente COM a flag X-Retry
          } catch (refreshError: any) {
            console.error('Falha ao atualizar o token:', refreshError.message);
            processQueue(refreshError);
            handleUnauthorizedLogout();
            throw refreshError;
          } finally {
            isRefreshing = false;
          }
        } else {
          return new Promise((resolve, reject) => {
            // Adiciona a requisição original (sem X-Retry) à fila
            failedQueue.push({ resolve, reject, options, path });
          }) as Promise<T>;
        }
      }

      const message =
        (Array.isArray((data as any)?.message)
          ? (data as any).message.join('\n')
          : (data as any)?.message) || (typeof data === 'string' ? data : `HTTP ${res.status}`);
      throw new HttpError(message, res.status, data);
    }

    return data as T;

  } catch (error: any) {
    clearTimeout(timer);

    // **CORREÇÃO AQUI**
    // Verifica o erro de timeout/abort de forma mais genérica
    if (error?.name === 'AbortError') {
      console.error(`Timeout ou abort na requisição para ${path}`);
      throw new Error('A requisição demorou muito ou foi cancelada.');
    }
    // Verifica erro de rede comum no React Native
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
       console.error(`Erro de rede na requisição para ${path}`);
       throw new Error('Falha de conexão. Verifique sua internet.');
    }

    if (error instanceof HttpError) {
      throw error;
    }

    console.error(`Erro inesperado na requisição para ${path}:`, error);
    throw new Error('Ocorreu um erro inesperado.');
  }
}