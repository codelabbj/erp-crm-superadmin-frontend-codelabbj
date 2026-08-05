export function computePlanPricePreview(input: {
  listPriceMonthly: number;
  listPriceYearly?: number;
  promoPercent: number;
  annualDiscountPercent: number;
}) {
  const listMonthly = Math.max(0, input.listPriceMonthly);
  const listYearly = Math.max(0, input.listPriceYearly ?? listMonthly * 12);
  const promo = Math.min(100, Math.max(0, input.promoPercent));
  const annual = Math.min(100, Math.max(0, input.annualDiscountPercent));
  const promoFactor = 1 - promo / 100;
  const annualFactor = 1 - annual / 100;
  const priceMonthly = Math.round(listMonthly * promoFactor);
  const priceYearly = Math.round(listYearly * promoFactor * annualFactor);
  return { listMonthly, listYearly, priceMonthly, priceYearly, promo, annual };
}

export function isQuoteBasedPlanCode(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  return normalized === "business" || normalized === "enterprise";
}
