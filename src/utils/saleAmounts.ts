/**
 * Normalize Prisma Decimal / string / number from API JSON.
 */
function toNum(v: unknown): number {
  if (v == null || v === "") return NaN;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  }
  if (typeof v === "object" && v !== null && "toString" in v) {
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

type SaleLike = {
  subtotal?: unknown;
  totalTax?: unknown;
  discountAmount?: unknown;
  totalAmount?: unknown;
  saleItems?: Array<{ tax?: unknown; subtotal?: unknown }>;
};

function lineRollups(sale: SaleLike): { lineTax: number; lineSub: number } {
  const items = sale.saleItems;
  if (!Array.isArray(items) || items.length === 0) return { lineTax: 0, lineSub: 0 };
  let lineTax = 0;
  let lineSub = 0;
  for (const row of items) {
    const t = toNum(row.tax);
    const s = toNum(row.subtotal);
    if (Number.isFinite(t)) lineTax += t;
    if (Number.isFinite(s)) lineSub += s;
  }
  return { lineTax, lineSub };
}

/**
 * GST / sales tax: prefer header totalTax, else sum of line item tax (GET /sales now includes saleItems.tax).
 */
export function getSaleTaxTotal(sale: SaleLike): number {
  const header = toNum(sale.totalTax);
  if (Number.isFinite(header) && header > 0.0001) return roundMoney(header);

  const { lineTax } = lineRollups(sale);
  if (lineTax > 0.0001) return roundMoney(lineTax);

  const sub = toNum(sale.subtotal);
  const total = toNum(sale.totalAmount);
  const disc = toNum(sale.discountAmount ?? 0);
  if (Number.isFinite(total) && Number.isFinite(sub) && Number.isFinite(disc)) {
    const implied = total - sub + disc;
    if (implied > 0.0001) return roundMoney(implied);
  }
  return 0;
}

/**
 * Grand total charged: subtotal + tax − discount.
 * Uses line rollups when header fields are incomplete (common on some synced/offline rows).
 */
export function getSaleGrandTotal(sale: SaleLike): number {
  const stored = toNum(sale.totalAmount);
  const disc = toNum(sale.discountAmount ?? 0);
  const headerSub = toNum(sale.subtotal);
  const headerTax = toNum(sale.totalTax);
  const { lineTax, lineSub } = lineRollups(sale);

  const effTax =
    Number.isFinite(headerTax) && headerTax > 0.0001 ? headerTax : lineTax > 0.0001 ? lineTax : 0;
  const effSub =
    lineSub > 0.0001 ? lineSub : Number.isFinite(headerSub) ? headerSub : NaN;

  // 1. If we have a valid stored Total Amount from the DB, USE IT.
  // This is the most reliable source for what the customer actually paid.
  if (Number.isFinite(stored) && stored > 0) {
    return roundMoney(stored);
  }

  // 2. Calculations for missing or legacy data:
  if (Number.isFinite(effSub) && Number.isFinite(disc)) {
    // If we have tax but the stored amount is missing, we must decide 
    // if it was inclusive or exclusive. 
    // Defaulting to Inclusive logic (Total = Subtotal - Discount) 
    // to match user business logic.
    const inclusiveTotal = effSub - disc;
    return roundMoney(inclusiveTotal);
  }

  const fallbackTax = getSaleTaxTotal(sale);
  if (Number.isFinite(headerSub) && fallbackTax >= 0 && Number.isFinite(disc)) {
    return roundMoney(headerSub + fallbackTax - disc);
  }
  return 0;
}
