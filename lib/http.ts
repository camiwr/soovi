import { getToken } from './session';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;
console.log('[Soolu] BASE_URL =', BASE_URL); 
const TIMEOUT_MS = 80000;

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

export async function request<T = unknown>(
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL não definido no .env');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Timestamp': Date.now().toString(),
    ...(options.headers || {}),
  };

  if (options.auth) {
    const token = await getToken();
    console.log('Token para requisição:', token ? `${token.substring(0, 20)}...` : 'nenhum');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      
      // Adiciona o email do token no header para validação no servidor
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.email) {
            headers['X-Expected-User-Email'] = payload.email;
          }
        }
      } catch (e) {
        console.warn('Não foi possível extrair email do token para validação');
      }
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal ?? controller.signal,
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const message =
        (Array.isArray((data as any)?.message)
          ? (data as any).message.join('\n')
          : (data as any)?.message) || `HTTP ${res.status}`;

      throw new HttpError(message, res.status, data);
    }

    return data as T;
  } finally {
    clearTimeout(timer);
  }
}
