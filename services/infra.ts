import { api } from "@/services/client";
import type { Infra } from "@/types/infra";

export async function listInfra(): Promise<Infra[]> {
  const { data } = await api.get<Infra[]>("/infra");
  return Array.isArray(data) ? data : [];
}
