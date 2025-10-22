export type User = {
  id: string;
  name: string;
  email: string;
  cpf?: string | null;
  phone?: string | null;
  // acrescente campos da sua API se houver
};

export type AuthResponseNormalized = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};
