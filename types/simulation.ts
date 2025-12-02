
export type InfraItem = {
  type: string;
  unit_value: number;
  installments: number;
};

export type UsedParameters = {
  imposto: string;
  comissao: string;
  lucro_parceiro: string;
  infra: InfraItem[];
};

export type ReceivablesScheduleApiItem = {
  [year: string]: number;
};

export type Simulation = {
  id: string;
  area_id: string;
  simulated_at: string;
  gross_estimated_value: number;
  infra_cost: number;
  tax_cost: number;
  commission_cost: number;
  total_discounts: number;
  net_revenue: number;
  carency_period: number;
  partner_profit: number;
  receiving_years: number;
  annual_receivable: number;
  used_parameters: UsedParameters;
  receivables_schedule: ReceivablesScheduleApiItem[];
  area?: {
    owner_id: string;
    name?: string;
    description?: string;
  };
};

export type SimulationListResponse = {
  simulationData: Simulation[];
  page: number;
  limit: number;
  count: number;
};

export type CreateSimulationDTO = {
  area_id: string;
  receiving_years: number;
  carency_period: number;
};

export type UpdateSimulationDTO = Partial<CreateSimulationDTO>;