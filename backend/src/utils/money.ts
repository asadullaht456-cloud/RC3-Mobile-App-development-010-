/**
 * Money utilities: converts between PKR decimals and integer paisa.
 * 1 PKR = 100 paisa.
 */

export function pkrToPaisa(pkr: number): number {
  return Math.round(pkr * 100);
}

export function paisaToPkr(paisa: number): number {
  return Number((paisa / 100).toFixed(2));
}

export function formatPkr(paisa: number): string {
  return (paisa / 100).toFixed(2);
}

