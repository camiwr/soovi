const hasIntl =
  typeof Intl !== "undefined" && typeof Intl.NumberFormat === "function";

type SimpleFormatter = {
  format: (n: number) => string;
};


function fallbackBRLFormat(n: number): string {
  const fixed = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  const parts = fixed.split(".");
  let intPart = parts[0];
  const decPart = parts[1] ?? "00";

  // coloca ponto a cada 3 dígitos
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `R$ ${intPart},${decPart}`;
}

const brlFormatter: SimpleFormatter = hasIntl
  ? (new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }) as unknown as SimpleFormatter)
  : { format: fallbackBRLFormat };

export function formatCurrencyBRL(
  value: number | string | null | undefined
): string {
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
  const cleaned = value.replace(/[^\d,.-]/g, "");
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
