/**
 * Stripe product/price configuration for bod.legal pricing plans.
 * Prices are in EUR cents. Single source of truth for checkout amounts.
 * CZK equivalents (for display only): rate ~25, rounded to marketing-friendly numbers.
 */
// NOTE: the basic plan is the free scan and intentionally has NO Stripe
// product. Checkout for a basic contract requires an upgrade to standard
// or premium (see payments.createCheckout).
export const STRIPE_PRODUCTS = {
  standard: {
    name: "Štandardná kontrola",
    description: "AI analýza + overenie advokátom, návrhy úprav (do 20 strán, do 24h)",
    priceAmount: 24900, // 249 €
    currency: "eur",
  },
  premium: {
    name: "Prémiová kontrola",
    description: "AI analýza + advokát + redline dokument s navrhovanými úpravami (do 50 strán, do 24h)",
    priceAmount: 49000, // 490 €
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
