export function formatCurrency(amount: number, locale: string = 'mn'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)

  if (locale === 'mn') {
    return `${formatted}₮`
  }
  return `₮${formatted}`
}

export function formatCompactCurrency(amount: number, locale: string = 'mn'): string {
  if (amount >= 1_000_000) {
    const value = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return locale === 'mn' ? `${value}M₮` : `₮${value}M`
  }
  if (amount >= 1_000) {
    const value = (amount / 1_000).toFixed(0)
    return locale === 'mn' ? `${value}K₮` : `₮${value}K`
  }
  return formatCurrency(amount, locale)
}
