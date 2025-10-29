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

export async function createArea(payload: CreateAreaDTO & { owner_id: string }): Promise<Area> {
  const { data } = await api.post<Area>("/area", payload);
  return data;
}

export async function updateArea(id: string, payload: UpdateAreaDTO, ownerId: string): Promise<Area> {
  const { data } = await api.patch<Area>(`/area/${id}`, {
    ...payload,
    owner_id: ownerId, 
  });
  return data;
}


export async function deleteArea(id: string, ownerId: string): Promise<void> {
  await api.request({
    method: "DELETE",
    url: `/area/${id}`,
    data: { owner_id: ownerId }, 
  });
}
