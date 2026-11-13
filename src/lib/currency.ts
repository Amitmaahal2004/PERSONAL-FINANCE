export const CURRENCY_MAP: Record<string, { symbol: string; name: string }> = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  AED: { symbol: 'AED', name: 'UAE Dirham' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
};

/**
 * Perform decimal-safe addition of two amounts
 */
export function safeAdd(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

/**
 * Perform decimal-safe subtraction of two amounts
 */
export function safeSubtract(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100;
}

/**
 * Perform decimal-safe multiplication
 */
export function safeMultiply(a: number, factor: number): number {
  return Math.round(a * factor * 100) / 100;
}

/**
 * Safely format monetary amount with currency symbol
 */
export function formatCurrency(
  amount: number | undefined | null,
  currencyCode: string = 'INR',
  customSymbol?: string
): string {
  const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const symbol = customSymbol || CURRENCY_MAP[currencyCode]?.symbol || '₹';

  const isNegative = validAmount < 0;
  const absAmount = Math.abs(validAmount);

  // Format with commas: Indian numbering format for INR, standard for others
  let formattedNumber: string;
  if (currencyCode === 'INR' || symbol === '₹') {
    formattedNumber = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formattedNumber = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}

