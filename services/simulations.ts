import { api } from "@/services/client";
// Importa os tipos atualizados (incluindo carency_period)
import type { Simulation, CreateSimulationDTO, UpdateSimulationDTO } from "@/types/simulation";

export async function listSimulations(): Promise<Simulation[]> {
  const { data } = await api.get<Simulation[]>("/simulation");
  return Array.isArray(data) ? data : [];
}

/**
 * Cria uma nova simulação.
 * O payload (CreateSimulationDTO) agora inclui 'carency_period'.
 */
export async function createSimulation(payload: CreateSimulationDTO): Promise<Simulation> {
  const { data } = await api.post<Simulation>("/simulation", payload);
  return data;
}

/**
 * Atualiza uma simulação.
 * O payload (UpdateSimulationDTO) agora pode incluir 'carency_period'.
 */
export async function updateSimulation(id: string, payload: UpdateSimulationDTO) {
  const { data } = await api.patch(`/simulation/${id}`, payload);
  return data;
}

export async function deleteSimulation(id: string) {
  const { data } = await api.delete(`/simulation/${id}`);
  return data;
}