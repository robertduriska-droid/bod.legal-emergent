/**
 * Stripe product/price configuration for bod.legal pricing plans.
 * Prices are in EUR cents.
 */
export const STRIPE_PRODUCTS = {
  basic: {
    name: "Základná kontrola",
    description: "AI analýza rizík, kontrola klauzula po klauzule, report rizík (do 20 strán)",
    priceAmount: 14900, // €149.00
    currency: "eur",
  },
  standard: {
    name: "Štandardná kontrola",
    description: "Všetko zo Základnej + kontrola advokátom, návrhy úprav (do 50 strán)",
    priceAmount: 34900, // €349.00
    currency: "eur",
  },
  premium: {
    name: "Prémiová kontrola",
    description: "Plná právna analýza, 30min konzultácia, redline dokument (do 100 strán)",
    priceAmount: 74900, // €749.00
    currency: "eur",
  },
  // Audit plan is custom-priced, handled separately via contact form
} as const;

export type StripePlanId = keyof typeof STRIPE_PRODUCTS;
