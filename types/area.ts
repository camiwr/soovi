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
  totalAreaHectare: number;
  lotSize: string;
  registrationNumber?: string;
  // Endereço dividido
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  linkLocation?: string;
  // Preço sugerido em número (BRL)
  suggestedLotPrice?: number;
};

export type UpdateAreaDTO = Partial<CreateAreaDTO>;