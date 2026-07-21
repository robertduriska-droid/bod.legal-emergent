// "Everything is free" switch. While this is on, the service never charges:
// payments.createCheckout skips Stripe entirely and grants the plan, so no
// card is ever taken and no Stripe session is created.
//
// Turned on while the service is under review. To go back to charging: set
// FREE_MODE=0 in Railway Variables (no code change), or flip the default here
// and redeploy. The paid prices themselves are untouched in the code, so
// switching back does not need them to be typed in again.
const FREE_MODE_DEFAULT = true;

export function isEverythingFree(): boolean {
  const v = (process.env.FREE_MODE || "").trim().toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return FREE_MODE_DEFAULT;
}
