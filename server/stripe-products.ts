/**
 * Stripe product/price configuration for bod.legal pricing plans.
 * Prices are in EUR cents. Single source of truth for checkout amounts.
 * CZK equivalents (for display only): rate ~25, rounded to marketing-friendly numbers.
 */
export const STRIPE_PRODUCTS = {
  basic: {
    name: "Základná kontrola",
    description: "AI analýza rizík s odkazmi na Slov-Lex a EUR-Lex (do 30 strán, do 24h)",
    priceAmount: 19700, // 197 €
    currency: "eur",
  },
  standard: {
    name: "Štandardná kontrola",
    description: "AI analýza + overenie advokátom, návrhy úprav (do 50 strán, do 24h)",
    priceAmount: 29700, // 297 €
    currency: "eur",
  },
  premium: {
    name: "Prémiová kontrola",
    description: "AI analýza + advokát + redline dokument s navrhovanými úpravami (do 100 strán, do 24h)",
    priceAmount: 49700, // 497 €
    currency: "eur",
  },
  express: {
    name: "Express dodanie",
    description: "Prioritné spracovanie do 4 hodín",
    priceAmount: 12700, // 127 € add-on
    currency: "eur",
  },
} as const;

export type StripePlanId = keyof typeof STRIPE_PRODUCTS;
