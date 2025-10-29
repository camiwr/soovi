import { api } from "@/services/client";
import type { Simulation, CreateSimulationDTO, UpdateSimulationDTO } from "@/types/simulation";

export async function listSimulations(): Promise<Simulation[]> {
  const { data } = await api.get<Simulation[]>("/simulation");
  return Array.isArray(data) ? data : [];
}

export async function createSimulation(payload: CreateSimulationDTO): Promise<Simulation> {
  const { data } = await api.post<Simulation>("/simulation", payload);
  return data;
}

export async function updateSimulation(id: string, payload: UpdateSimulationDTO) {
  const { data } = await api.patch(`/simulation/${id}`, payload);
  return data;
}

export async function deleteSimulation(id: string) {
  const { data } = await api.delete(`/simulation/${id}`);
  return data;
}