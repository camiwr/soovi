import { request, HttpError } from '../lib/http';

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

export async function searchAreas(params: {
  owner_id: string;   // <-- você passa o user.id aqui
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;

  // 1) GET com query
  const qs = new URLSearchParams({
    owner_id: params.owner_id,
    page: String(page),
    limit: String(limit),
  });
  try {
    return await request<Area[]>(`/area/search?${qs.toString()}`, { auth: true });
  } catch (e) {
    // 2) POST com body (fallback)
    if (e instanceof HttpError && e.status === 400) {
      return await request<Area[]>(`/area/search`, {
        method: 'POST',
        body: { owner_id: params.owner_id, page, limit },
        auth: true,
      });
    }
    throw e;
  }
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