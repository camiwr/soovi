import { request } from '../lib/http';
import { deleteToken, saveToken } from '../lib/session';

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

// LOGIN: enviar { email, password } — o back retorna { access_token, refresh_token }
export async function loginPassword(email: string, password: string) {
  const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const sessionBuster = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('=== EXECUTANDO LOGIN NO SERVIDOR ===');
  console.log('Request ID:', requestId);
  console.log('Session Buster:', sessionBuster);
  console.log('URL:', `${process.env.EXPO_PUBLIC_API_URL}/auth/login-password`);
  console.log('Email enviado:', email);
  
  // MÚLTIPLAS tentativas de logout para garantir limpeza completa
  const logoutUrls = [
    '/auth/logout',
    '/auth/logout-all',
    '/auth/invalidate-sessions'
  ];
  
  for (const url of logoutUrls) {
    try {
      console.log(`Tentando logout em: ${url}`);
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Force-Logout': 'true',
          'X-Clear-All-Sessions': 'true'
        },
      });
    } catch (logoutError) {
      console.log(`Logout em ${url} falhou (ok)`);
    }
  }
  
  // Aguarda mais tempo após logout
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // uso fetch direto pra evitar qualquer interferência
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/login-password?_=${sessionBuster}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Request-ID': requestId,
      'X-Force-New-Session': 'true',
      'X-Session-Buster': sessionBuster,
      'X-Clear-Cache': 'true',
      'X-Timestamp': Date.now().toString(),
      'Connection': 'close'
    },
    body: JSON.stringify({ 
      email: email.trim(), 
      password: password,
      sessionBuster: sessionBuster,
      forceNewSession: true,
      clearPreviousSessions: true
    }),
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

  console.log('Token recebido do servidor, validando...');
  
  // VALIDAÇÃO CRÍTICA: Verifica se o token corresponde ao email enviado
  try {
    const tokenParts = data.access_token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      const tokenEmail = payload.email;
      
      console.log('Email enviado no login:', email.trim());
      console.log('Email no token recebido:', tokenEmail);
      
      if (tokenEmail && tokenEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
        console.error('🚨 TOKEN INCONSISTENTE RECEBIDO DO SERVIDOR!');
        console.error('Email enviado:', email.trim());
        console.error('Email no token:', tokenEmail);
        
        // REJEITA IMEDIATAMENTE - não salva token incorreto
        throw new Error(`SERVIDOR RETORNOU TOKEN ERRADO! Esperado: ${email.trim()}, Recebido: ${tokenEmail}`);
      }
      
      console.log('✅ Token validado - email correto');
    }
  } catch (validationError) {
    console.error('Erro na validação do token:', validationError);
    throw validationError instanceof Error ? validationError : new Error('Token inválido recebido do servidor');
  }
  
  console.log('Token validado com sucesso, salvando...');
  await saveToken(data.access_token);
  console.log('Token salvo com sucesso');
  
  return data;
}

// CADASTRO: enviar password plano em password
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
      password: input.password,
      cpf: input.cpf,
      phone: input.phone,
      type: input.type,
    },
  });
}

export async function me() {
  const requestId = `me_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const cacheBuster = Date.now().toString();
  
  console.log('=== BUSCANDO DADOS DO USUÁRIO ===');
  console.log('Request ID:', requestId);
  console.log('Cache Buster:', cacheBuster);
  
  const result = await request<User>(`/users/me?_=${cacheBuster}`, { 
    auth: true,
    headers: {
      'X-Request-ID': requestId,
      'X-Cache-Buster': cacheBuster,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Force-Fresh-Data': 'true'
    }
  });
  
  console.log('Usuário retornado (Request:', requestId, '):', { 
    id: result.id, 
    email: result.email, 
    name: result.name 
  });
  
  return result;
}

export async function updateUser(id: string, payload: Partial<Pick<User, 'name' | 'phone'>>) {
  return request<User>(`/users/${id}`, { method: 'PATCH', body: payload, auth: true });
}

export async function logout() {
  console.log('=== FAZENDO LOGOUT NO SERVIDOR ===');
  try {
    // Tenta fazer logout no servidor primeiro
    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    console.log('Logout no servidor concluído');
  } catch (error) {
    console.log('Erro no logout do servidor (pode ser normal):', error);
  }
  
  // Sempre limpa o token local
  await deleteToken();
  console.log('Token local removido');
}

// Função específica para forçar logout completo
export async function forceLogoutEverywhere() {
  console.log('=== FORÇANDO LOGOUT COMPLETO ===');
  
  // Faz logout no servidor
  await logout();
  
  // Aguarda um pouco
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Força limpeza local
  await deleteToken();
  
  console.log('Logout completo realizado');
}
