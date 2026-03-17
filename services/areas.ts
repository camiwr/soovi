import { api } from "@/services/client";
import type { Area, CreateAreaDTO, UpdateAreaDTO } from "@/types/area";

function normalizeArea(src: any): Area {
  if (!src) return src;

  const address = src.address ?? src.location ?? null;
  const location = address
    ? (() => {
        try {
          const parts: string[] = [];
          if (address.street) parts.push(address.street + (address.number ? `, ${address.number}` : ""));
          if (address.district) parts.push(address.district);
          if (address.city) parts.push(address.city);
          if (address.state) parts.push(address.state);
          return parts.join(" - ");
        } catch {
          return String(address);
        }
      })()
    : src.location ?? null;

  return {
    id: src.id,
    owner_id: src.ownerId ?? src.owner_id,
    description: src.description ?? src.desc ?? "",
    total_area_hectare: src.totalAreaHectare ?? src.total_area_hectare ?? 0,
    registration_number: src.registrationNumber ?? src.registration_number ?? null,
    location: location ?? null,
    suggested_lot_price: src.suggestedLotPrice ?? src.suggested_lot_price ?? null,
    lot_size: src.lotSize ?? src.lot_size ?? "",
    created_at: src.createdAt ?? src.created_at ?? new Date().toISOString(),
  } as Area;
}

// ... (listAreasByOwner e getArea permanecem iguais) ...
export async function listAreasByOwner(
  ownerId: string,
  opts?: { timestamp?: number }
): Promise<Area[]> {
  try {
    // A API valida estritamente os query params — não enviar `owner_id` nem `_`.
    // O backend deve derivar o owner do token; portanto chamamos sem params.
    const { data } = await api.get("/area/search");

    const items: any[] = Array.isArray(data)
      ? data
      : // @ts-ignore
      Array.isArray(data?.areas)
      ? data.areas
      : // @ts-ignore
      Array.isArray(data?.data)
      ? data.data
      : [];

    return items.map(normalizeArea);
  } catch (e: any) {
    console.error("Erro ao buscar áreas:", e?.response ?? e);
    const serverMsg = e?.response?.data?.message ?? e?.response?.data ?? e?.message;
    throw new Error(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
  }
}

export async function getArea(id: string): Promise<Area> {
  const { data } = await api.get(`/area/${id}`);
  const payload = data?.data ?? data;
  return normalizeArea(payload);
}

// ... (createArea permanece igual) ...
export async function createArea(payload: CreateAreaDTO, ownerId: string): Promise<Area> {
  const finalPayload = { ...payload, ownerId };
  const { data } = await api.post<Area>("/area", finalPayload);
  return data;
}

/* * CORREÇÃO 1: updateArea
 * Agora aceita 'owner_id' e o envia no payload do PATCH.
 */
export async function updateArea(id: string, payload: UpdateAreaDTO, ownerId: string): Promise<Area> {
  const finalPayload = { ...payload, ownerId };
  const { data } = await api.patch<Area>(`/area/${id}`, finalPayload);
  return data;
}

/* * CORREÇÃO 2: deleteArea
 * Agora aceita 'owner_id' e o envia no corpo (data) da requisição DELETE.
 */
export async function deleteArea(id: string, ownerId: string): Promise<void> {
  await api.delete(`/area/${id}`, {
    data: { ownerId } // Envia o ownerId no corpo do DELETE
  });
}