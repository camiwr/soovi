import { request } from '../lib/http';
import { deleteTokens, getTokens, saveTokens } from '../lib/session';
import { User, SignUpInput } from '../types/auth'; 

type LoginResponse = {
  access_token: string;
  refresh_token: string; 
};


export async function loginPassword(email: string, password: string): Promise<void> {
  console.log('Executando login no servidor para:', email);

  const data = await request<LoginResponse>('/auth/login-password', { // Sem cache buster aqui, confiamos na correção do backend ou no fluxo de refresh
    method: 'POST',
    body: {
      email: email.trim(),
      password: password,
    },
  });

  if (!data?.access_token || !data?.refresh_token) {
    throw new Error('Resposta de login incompleta do servidor (access ou refresh token faltando).');
  }

  await saveTokens(data.access_token, data.refresh_token);
}

export async function refreshToken(): Promise<void> {
  const tokens = await getTokens();
  const currentRefreshToken = tokens.refreshToken;

  if (!currentRefreshToken) {
    console.warn('Tentativa de refresh sem refresh token.');
    throw new Error('Sessão inválida para renovação.'); // Erro específico para logout
  }

  console.log('Tentando atualizar tokens usando o refresh token...');
  const data = await request<LoginResponse>('/auth/refresh-token', {
    method: 'POST',
    body: {
      refresh_token: currentRefreshToken,
    },
  });

  if (!data?.access_token || !data?.refresh_token) {
    throw new Error('Resposta de refresh token inválida do servidor.');
  }

  await saveTokens(data.access_token, data.refresh_token);
  console.log('Tokens atualizados com sucesso via refresh.');
}

export async function createUser(input: SignUpInput) {
  return request('/auth/create-user', {
    method: 'POST',
    body: input,
  });
}


export async function me(): Promise<User> {
  return request<User>('/users/me', { auth: true });
}


export async function updateUser(id: string, payload: Partial<Pick<User, 'name' | 'phone'>>) {
  return request<User>(`/users/${id}`, { method: 'PATCH', body: payload, auth: true });
}


export async function logout() {
  console.log('Executando logout local.');
  await deleteTokens();
}