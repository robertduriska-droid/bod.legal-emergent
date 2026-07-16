// Single source of truth for bod.legal contact details.
//
// These used to be hardcoded in FloatingContact, Footer and About, with the
// same number written out four times. Changing one and forgetting the others is
// how a law firm ends up publishing a number that no longer answers, so they
// live here now. Change once, everywhere follows.

export const CONTACT = {
  /** WhatsApp business line. Digits only, international format, no + or spaces. */
  whatsappNumber: "421905329200",
  /** How the WhatsApp number is shown to a human. */
  whatsappDisplay: "+421 905 329 200",

  /** Voice line. */
  phoneNumber: "+421917333692",
  phoneDisplay: "+421 917 333 692",

  email: "robert.duriska@bod.legal",
} as const;

/** wa.me deep link with a prefilled message in the client's language. */
export function whatsappUrl(prefill: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(prefill)}`;
}
