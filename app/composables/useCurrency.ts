export function useCurrency() {
  const format = (amount: number): string =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)

  return { format }
}
