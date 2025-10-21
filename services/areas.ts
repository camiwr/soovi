import { request } from '../lib/http';
import { Area, SearchAreasResponse } from '../types/areas'; // <--- IMPORTADO

async function ensureAuthenticated() {
  const { getTokens } = await import('../lib/session');
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }
  return accessToken;
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
  return request<SearchAreasResponse>(url, { auth: true });
}

export async function getArea(id: string): Promise<Area> {
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
}): Promise<Area> {
  return request<Area>('/area', { method: 'POST', body, auth: true });
}

export async function updateArea(id: string, body: Partial<Area>): Promise<Area> {
  await ensureAuthenticated();
  return request<Area>(`/area/${id}`, { method: 'PATCH', body, auth: true });
}

export async function deleteArea(id: string) {
  await ensureAuthenticated();
  return request(`/area/${id}`, { method: 'DELETE', auth: true });
}