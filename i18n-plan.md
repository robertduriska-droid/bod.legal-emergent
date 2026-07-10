# i18n Implementation Progress (EN version of bod.legal)

## Architecture (DONE)
- `client/src/i18n/types.ts` — Translations interface
- `client/src/i18n/sk.ts` — Slovak translations (full)
- `client/src/i18n/en.ts` — English translations (full)
- `client/src/i18n/index.ts` — context, useT() hook, detectLocaleFromPath, stripLocalePrefix
- `client/src/i18n/I18nProvider.tsx` — provider based on wouter useLocation
- `client/src/components/LanguageSwitcher.tsx` — SK | EN toggle in header
- Routing: SK at `/`, EN at `/en/*` (all routes duplicated in App.tsx). EN aliases: /en/terms→VOP, /en/privacy→GDPR, /en/sample-report→SampleReport
- useT() returns { locale, t, localePath(path), switchLocalePath(currentPath) }

## Pages/components updated (DONE)
- App.tsx (routes + I18nProvider)
- Header.tsx, Footer.tsx, SplashIntro.tsx, CookieConsent.tsx, FloatingContact.tsx
- Home.tsx (fully translated incl. reviews EN inline)
- Upload.tsx (uses t.upload.*, language param = locale)
- Dashboard.tsx (status labels, plan labels, dates per locale)
- About.tsx (inline content object per locale)

## TODO (remaining)
- DemoAnimation.tsx — hardcoded Slovak: stepLabels ["Nahratie","Analýza","Report"], and inside steps (search for Slovak strings). Use t.demo.* keys which exist already.
- ContractDetail.tsx, Report.tsx, FreeSken.tsx, SampleReport.tsx, VOP.tsx, GDPR.tsx, Cookies.tsx, NotFound.tsx — these are lower priority; ContractDetail + Report have Slovak strings. VOP/GDPR/Cookies legal pages can stay Slovak-only with note, but EN routes point to them.
- NotificationBell.tsx — check for Slovak strings
- Verify tests pass (pnpm test), take screenshots of / and /en, checkpoint, deliver.

## Verified
- Screenshots of / and /en look correct (hero, stats, nav translated)
- Dev server running clean, no TS errors after upload keys added

## Notes
- PRICING_PLANS from @shared/types has nameSk + features (Slovak); EN uses t.pricing.* arrays instead
- plan.delivery is Slovak "do 24 hodín" — EN uses t.pricing.basicTime
- todo.md has "## English Version (i18n)" section with [ ] items to mark complete
