const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyBRL(value: number | string | null | undefined) {
  const num =
    typeof value === "number"
      ? value
      : value != null
      ? Number(value)
      : 0;

  if (Number.isNaN(num)) return brlFormatter.format(0);
  return brlFormatter.format(num);
}

/**
 * Converte uma string de moeda BRL ("R$ 1.234,56") para número (1234.56).
 */
export function parseCurrencyBRLToNumber(
  value: string | null | undefined
): number | undefined {
  if (!value) return undefined;
  // remove tudo que não for dígito, vírgula, ponto ou sinal
  const cleaned = value.replace(/[^\d,.-]/g, "");
  // remove pontos de milhar e troca vírgula decimal por ponto
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Máscara para input de moeda:
 * pega o que o usuário digitou, mantém só dígitos,
 * divide por 100 e formata como BRL.
 */
export function maskCurrencyInputBRL(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";

  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";

  const value = cents / 100;
  return brlFormatter.format(value);
}
