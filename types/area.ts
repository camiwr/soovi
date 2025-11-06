export type Area = {
  id: string;
  owner_id: string;
  description: string;
  total_area_hectare: number;
  registration_number?: string | null;
  location?: string | null;
  suggested_lot_price?: number | null;
  lot_size: string;
  created_at: string;
};

export type CreateAreaDTO = {
  description: string;
  total_area_hectare: number;
  registration_number?: string;
  location?: string;
  suggested_lot_price?: number;
  lot_size: string;
};

export type UpdateAreaDTO = Partial<CreateAreaDTO>;