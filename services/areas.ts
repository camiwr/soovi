import { request } from '../lib/http';

export type Area = {
  id: string;
  owner_id: string;
  description?: string;
  total_area_hectare?: number;
  registration_number?: string;
  location?: string;
  suggested_lot_price_m2?: number;
  lot_size?: number;
  created_at: string;
};

type SearchAreasResponse = {
  total: number;
  limit: number;
  page: number;
  areas: Area[];
};

// Função helper para verificar se há token válido
async function ensureAuthenticated() {
  const { getToken } = await import('../lib/session');
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }
  return token;
}

export async function searchAreas(params: {
  owner_id: string; 
  page?: number;
  limit?: number;
}): Promise<SearchAreasResponse> {
  const qs = new URLSearchParams({
    owner_id: params.owner_id,
  });
  
  const url = `/area/search?${qs.toString()}`;
  console.log('Chamando API:', url);
  console.log('Owner ID:', params.owner_id);
  
  const result = await request<SearchAreasResponse>(url, { auth: true });
  console.log('Resultado da API /area/search:', result);
  
  return result;
}

export async function getArea(id: string) {
  return request<Area>(`/area/${id}`, { auth: true });
}

export async function createArea(body: {
  owner_id: string;
  description: string;
  total_area_hectare: number;
  registration_number?: string | null;
  location?: string | null;
  suggested_lot_price_m2: number;
  lot_size?: number | null;
}) {
  return request<Area>('/area', { method: 'POST', body, auth: true });
}

export async function updateArea(id: string, body: Partial<Area>) {
  try {
    await ensureAuthenticated();
    console.log('Atualizando área:', id, body);
    const result = await request<Area>(`/area/${id}`, { method: 'PATCH', body, auth: true });
    console.log('Área atualizada com sucesso:', result);
    return result;
  } catch (error: any) {
    console.error('Erro ao atualizar área:', error);
    if (error?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw error;
  }
}

export async function deleteArea(id: string) {
  try {
    await ensureAuthenticated();
    console.log('Deletando área:', id);
    const result = await request(`/area/${id}`, { method: 'DELETE', auth: true });
    console.log('Área deletada com sucesso');
    return result;
  } catch (error: any) {
    console.error('Erro ao deletar área:', error);
    if (error?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw error;
  }
}