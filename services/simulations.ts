import { api } from "@/services/client";
import type {
  Simulation,
  SimulationListResponse,
  CreateSimulationDTO,
  UpdateSimulationDTO,
} from "@/types/simulation";

export async function listSimulations(page = 1, limit = 10): Promise<SimulationListResponse> {
  const { data } = await api.get<SimulationListResponse>("/simulation", {
    params: { page, limit },
  });
  return data;
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
