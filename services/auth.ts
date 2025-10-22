import axios from "axios";
import { api } from "./client";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export async function loginPassword(payload: { email: string; password: string }) {
  const { data } = await api.post("/auth/login-password", payload);
  return data;
}

export async function createUser(payload: {
  name: string;
  email: string;
  cpf?: string;
  phone?: string | null;
  password?: string;
}) {
  const { data } = await api.post("/auth/create-user", payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/users/me");
  return data?.user ?? data;
}

export async function safeGetMe(accessToken: string) {
  const now = Date.now();
  const { data } = await axios.get(`${API_URL}/users/me?_=${now}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
  return data?.user ?? data;
}