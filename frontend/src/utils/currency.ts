/**
 * Formats a numeric amount in PKR currency with strictly 2 decimal places and thousands commas.
 * Example: 4200 -> "PKR 4,200.00"
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'PKR 0.00';
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const parts = absVal.toFixed(2).split('.');
  const intPartWithCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = `${intPartWithCommas}.${parts[1]}`;

  return isNegative ? `-PKR ${formatted}` : `PKR ${formatted}`;
}

export function formatPKRAbs(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'PKR 0.00';
  }
  const absVal = Math.abs(amount);
  const parts = absVal.toFixed(2).split('.');
  const intPartWithCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `PKR ${intPartWithCommas}.${parts[1]}`;
}
