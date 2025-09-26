import { request } from '../lib/http';
import { saveToken, deleteToken } from '../lib/session';

export type User = {
  id: string;
  name: string;
  email: string;
  cpf?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

type LoginResponse = {
  access_token: string;
  refresh_token?: string;
  user?: User;
};

// LOGIN: enviar { email, password_hash } — o back retorna { access_token, refresh_token }
export async function loginPassword(email: string, password: string) {
  // uso fetch direto pra evitar qualquer interferência
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password_hash: password }),
  });

  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      const j = JSON.parse(text);
      message = Array.isArray(j?.message) ? j.message.join('\n') : j?.message || text;
    } catch {}
    throw new Error(message || `HTTP ${res.status}`);
  }

  const data: LoginResponse = JSON.parse(text);
  if (!data?.access_token) throw new Error('Resposta de login sem access_token');

  await saveToken(data.access_token);
  return data;
}

// CADASTRO: enviar password plano em password_hash
export async function createUser(input: {
  name: string;
  email: string;
  password: string; // plain
  cpf?: string;
  phone?: string;
  type?: string;
}) {
  return request('/auth/create-user', {
    method: 'POST',
    body: {
      name: input.name,
      email: input.email,
      password_hash: input.password,
      cpf: input.cpf,
      phone: input.phone,
      type: input.type,
    },
  });
}

export async function me() {
  return request<User>('/users/me', { auth: true });
}

export async function updateUser(id: string, payload: Partial<Pick<User, 'name' | 'phone'>>) {
  return request<User>(`/users/${id}`, { method: 'PATCH', body: payload, auth: true });
}

export async function logout() {
  await deleteToken();
}
