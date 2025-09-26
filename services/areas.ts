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

// Tipo para a resposta paginada da API
type SearchAreasResponse = {
  total: number;
  limit: number;
  page: number;
  areas: Area[];
};

export async function searchAreas(params: {
  owner_id: string;   // <-- você passa o user.id aqui
  page?: number;
  limit?: number;
}): Promise<SearchAreasResponse> {
  // Envia apenas o owner_id, sem page/limit para evitar problemas de validação
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
  return request<Area>(`/area/${id}`, { method: 'PATCH', body, auth: true });
}

export async function deleteArea(id: string) {
  return request(`/area/${id}`, { method: 'DELETE', auth: true });
}