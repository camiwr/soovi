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
