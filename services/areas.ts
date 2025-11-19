import { api } from "@/services/client";
import type { Area, CreateAreaDTO, UpdateAreaDTO } from "@/types/area";

// ... (listAreasByOwner e getArea permanecem iguais) ...
export async function listAreasByOwner(ownerId: string, p0: { timestamp: number; }): Promise<Area[]> {
  const { data } = await api.get("/area/search", { 
    params: { owner_id: ownerId } 
  });
  if (Array.isArray(data)) return data;
  // @ts-ignore
  if (Array.isArray(data?.areas)) return data.areas;
  // @ts-ignore
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function getArea(id: string): Promise<Area> {
  const { data } = await api.get<Area>(`/area/${id}`);
  return data;
}

// ... (createArea permanece igual) ...
export async function createArea(payload: CreateAreaDTO, owner_id: string): Promise<Area> {
  const finalPayload = { ...payload, owner_id };
  const { data } = await api.post<Area>("/area", finalPayload);
  return data;
}

/* * CORREÇÃO 1: updateArea
 * Agora aceita 'owner_id' e o envia no payload do PATCH.
 */
export async function updateArea(id: string, payload: UpdateAreaDTO, owner_id: string): Promise<Area> {
  const finalPayload = { ...payload, owner_id };
  const { data } = await api.patch<Area>(`/area/${id}`, finalPayload);
  return data;
}

/* * CORREÇÃO 2: deleteArea
 * Agora aceita 'owner_id' e o envia no corpo (data) da requisição DELETE.
 */
export async function deleteArea(id: string, owner_id: string): Promise<void> {
  await api.delete(`/area/${id}`, {
    data: { owner_id } // Envia o owner_id no corpo do DELETE
  });
}