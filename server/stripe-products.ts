/**
 * Stripe product/price configuration for bod.legal pricing plans.
 * Prices are in EUR cents. Single source of truth for checkout amounts.
 */
export const STRIPE_PRODUCTS = {
  basic: {
    name: "Základná kontrola",
    description: "AI analýza rizík s odkazmi na Slov-Lex a EUR-Lex (do 30 strán, do 24h)",
    priceAmount: 14900, // 149 eur
    currency: "eur",
  },
  standard: {
    name: "Štandardná kontrola",
    description: "AI analýza + overenie advokátom, návrhy úprav (do 50 strán, do 24h)",
    priceAmount: 24900, // 249 eur
    currency: "eur",
  },
  premium: {
    name: "Prémiová kontrola",
    description: "AI analýza + advokát + redline dokument s navrhovanými úpravami (do 100 strán, do 24h)",
    priceAmount: 39900, // 399 eur
    currency: "eur",
  },
  express: {
    name: "Express dodanie",
    description: "Prioritné spracovanie do 4 hodín",
    priceAmount: 9900, // 99 eur add-on
    currency: "eur",
  },
} as const;

export type StripePlanId = keyof typeof STRIPE_PRODUCTS;
