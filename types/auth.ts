export type User = {
  id: string;
  name: string;
  email: string;
  cpf?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type LoginResponse = {
  access_token: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
  type?: string;
};