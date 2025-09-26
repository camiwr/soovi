import { request } from '../lib/http';

export type Area = {
  id: string;
  description?: string | null;
  total_area_hectare?: number;
  registration_number?: string | null;
  location?: string | null;
  suggested_lot_price_m2?: number | null;
  lot_size?: number | null;
  created_at?: string;
};

export async function createArea(body: {
  description?: string;
  total_area_hectare?: number;
  registration_number?: string;
  location?: string;
  suggested_lot_price_m2?: number;
  lot_size?: number;
}) {
  return request<Area>('/area', { method: 'POST', body, auth: true });
}