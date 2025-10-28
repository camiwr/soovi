export type Area = {
  id: string;
  owner_id: string;
  description: string;
  total_area_hectare: number;
  registration_number?: string | null;
  location?: string | null;
  suggested_lot_price_m2?: number | null;
  lot_size?: number | null;
  created_at: string;
};

export type CreateAreaDTO = {
  description: string;
  total_area_hectare: number;
  registration_number?: string;
  location?: string;
  suggested_lot_price_m2?: number;
  lot_size?: number;
};

export type UpdateAreaDTO = Partial<CreateAreaDTO>;
