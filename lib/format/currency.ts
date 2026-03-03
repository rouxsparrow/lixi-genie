const sgdFormatter = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "SGD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatSGD(amount: number): string {
  return sgdFormatter.format(amount);
}
