export type UsedInfraItem = {
  type: string;
  unit_value: number;
  installments: number;
};

export type UsedParameters = {
  infra: UsedInfraItem[];
  imposto?: string | null;
  comissao?: string | null;
  lucro_parceiro?: string | null;
};

export type Simulation = {
  id: string;
  area_id: string;
  simulated_at: string;
  gross_estimated_value: number;
  total_sales_value: number;
  infra_cost: number;
  tax_cost: number;
  commission_cost: number;
  total_discounts: number;
  net_revenue: number;
  project_balance: number;
  partner_profit: number;
  receiving_years: number;
  annual_receivable: number;
  used_parameters: UsedParameters;
  carency_period?: number;
};

export type CreateSimulationDTO = {
  area_id: string;
  receiving_years: number; 
  carency_period: number; 
};

export type UpdateSimulationDTO = Partial<CreateSimulationDTO>;