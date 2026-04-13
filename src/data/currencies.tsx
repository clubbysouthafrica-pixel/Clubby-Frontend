type Currency = {
    code: string;
    name: string;
    symbol: string;
}

export const currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    // { code: "EUR", name: "Euro", symbol: "€" },
    // { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "ZAR", name: "South African Rand", symbol: "R" },
    // { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    // { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    // { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    // { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    // { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    // { code: "INR", name: "Indian Rupee", symbol: "₹" },
    // { code: "BRL", name: "Brazilian Real", symbol: "R$" },
    // { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    // { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
    // { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
    // { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  ];
  
/**
 * Converts a cent amount to formatted string with symbol.
 * @param amountCents - e.g., 1234 = $12.34
 * @param currencyCode - e.g., 'USD'
 */
export function formatAmount(
    amountCents?: number | null,
    currencyCode?: string
  ): string {
    const currency = currencies.find(c => c.code === currencyCode);
    const safeAmountCents =
      typeof amountCents === "number" && Number.isFinite(amountCents)
        ? amountCents
        : 0;
    const amount = safeAmountCents / 100;
  
    if (!currency) {
      return `${currencyCode ? `${currencyCode} ` : ""}${amount.toFixed(2)}`;
    }
  
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
  