export type Area = {
  id: string;
  owner_id: string;
  description?: string;
  total_area_hectare?: number;
  registration_number?: string;
  location?: string;
  suggested_lot_price_m2?: number;
  lot_size?: number;
  created_at: string;
};

export type SearchAreasResponse = {
  total: number;
  limit: number;
  page: number;
  areas: Area[];
};