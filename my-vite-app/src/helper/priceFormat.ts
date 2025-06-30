/**
 * Formats a number as a price string with the specified currency
 * @param price - The price to format
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted price string
 */
export const priceFormat = (
  price: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("ar-SY", {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Example usage:
// priceFormat(1000) -> "$1,000"
// priceFormat(1000, 'EUR') -> "€1,000"
// priceFormat(1500000, 'GBP') -> "£1,500,000"
