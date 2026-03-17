import { api } from "@/services/client";
import type {
    CreateSimulationDTO,
    Simulation,
    SimulationListResponse,
    UpdateSimulationDTO,
} from "@/types/simulation";

export async function listSimulations(page = 1, limit = 10): Promise<SimulationListResponse> {
  const { data } = await api.get<any>("/simulation", {
    params: { page, limit },
  });

  // Normaliza formatos variados que a API pode retornar:
  // - array direto de simulações
  // - { simulationData: [...] }
  // - { data: [...] }
  if (Array.isArray(data)) {
    return { simulationData: data, page, limit, count: data.length };
  }

  if (data && Array.isArray(data.simulationData)) {
    return data as SimulationListResponse;
  }

  if (data && Array.isArray(data.data)) {
    return {
      simulationData: data.data,
      page: data.page ?? page,
      limit: data.limit ?? limit,
      count: data.count ?? data.data.length,
    };
  }

  const maybeArr = data?.simulationData ?? data?.data ?? [];
  return {
    simulationData: Array.isArray(maybeArr) ? maybeArr : [],
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    count: data?.count ?? (Array.isArray(maybeArr) ? maybeArr.length : 0),
  };
}

export async function getSimulation(id: string): Promise<Simulation> {
  const { data } = await api.get<Simulation>(`/simulation/${id}`);
  return data;
}

export async function createSimulation(payload: CreateSimulationDTO): Promise<Simulation> {
  const { data } = await api.post<Simulation>("/simulation", payload);
  return data;
}

export async function updateSimulation(
  id: string,
  payload: UpdateSimulationDTO
): Promise<Simulation> {
  const { data } = await api.patch<Simulation>(`/simulation/${id}`, payload);
  return data;
}

export async function deleteSimulation(id: string): Promise<void> {
  await api.delete(`/simulation/${id}`);
}
