// Dado que o shape pode variar, este helper "padrão" extrai tokens e user.
export function normalizeAuthResponse(raw: any): {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
} {
  const root = raw?.data ?? raw;

  const user = root?.user ?? root?.data?.user ?? null;
  const accessToken = root?.accessToken ?? root?.access_token ?? root?.data?.accessToken ?? null;
  const refreshToken = root?.refreshToken ?? root?.refresh_token ?? root?.data?.refreshToken ?? null;

  return { user, accessToken, refreshToken };
}

export function extractErrorMessage(e: any): string {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error?.message ||
    e?.message ||
    "Ocorreu um erro."
  );
}
