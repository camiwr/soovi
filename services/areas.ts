// services/areas.ts
import { api } from "@/services/client";
import type { Area, CreateAreaDTO, UpdateAreaDTO } from "@/types/area";

// LISTAR (ok)
export async function listAreasByOwner(ownerId: string): Promise<Area[]> {
  const { data } = await api.get("/area/search", { params: { owner_id: ownerId } });
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

// ESTE ESTÁ FUNCIONANDO - NÃO MEXER
export async function createArea(payload: CreateAreaDTO & { owner_id: string }): Promise<Area> {
  const { data } = await api.post<Area>("/area", payload);
  return data;
}

// CORREÇÃO: Removido 'ownerId' dos argumentos e do corpo do patch.
// O backend deve usar o token para autorização.
export async function updateArea(id: string, payload: UpdateAreaDTO): Promise<Area> {
  const { data } = await api.patch<Area>(`/area/${id}`, payload);
  return data;
}

// CORREÇÃO: Removido 'ownerId' dos argumentos e o corpo 'data' da requisição.
export async function deleteArea(id: string): Promise<void> {
  await api.request({
    method: "DELETE",
    url: `/area/${id}`,
    // O backend deve identificar o usuário pelo token.
  });
}