/**
 * Formats a number to Indian currency format (e.g., 1,23,456)
 */
export function formatIndianCurrency(amount: number, includeSymbol = true): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  
  let formatted = formatter.format(amount);
  
  // Custom logic for "Cr" and "L" if needed, but the prompt shows both ₹ 4.18 cr and ₹ 62 L
  // Let's create a more flexible one for the "Cr" and "L" labels
  return formatted;
}

export function formatLargeAmount(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return formatIndianCurrency(amount);
}

export function formatAging(hours: number): string {
  if (hours >= 48) return `${Math.floor(hours / 24)}d`;
  return `${hours}h`;
}

export function formatVariance(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(abs);
  return amount < 0 ? `−${formatted}` : formatted;
}

export function exceptionTypeFromLabel(label: string): string {
  if (label === 'All types') return 'All';
  return label.toLowerCase().replace(/ /g, '_');
}

const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  overcharge: 'Overcharge',
  missing_settlement: 'Missing Settlement',
  amount_mismatch: 'Amount Mismatch',
  unidentified_debit: 'Unidentified Debit',
  duplicate_credit: 'Duplicate credit',
  late_credit: 'Late credit',
};

export function exceptionTypeLabel(type: string): string {
  return EXCEPTION_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}
