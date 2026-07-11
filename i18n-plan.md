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

## Checkpoint 55fe837b saved (main pages done). Published domain: bodlegal-mqcbxxfs.manus.space

## TODO (remaining)
- DemoAnimation.tsx — DONE (inline texts object per locale)
- FloatingContact.tsx — DONE (aria labels)
- EN splash tagline set to "trust. speed. results." — DONE
- FreeSken.tsx — DONE (TX object, localePath links)
- ContractDetail.tsx — DONE (TX object, localePath links)
- Report.tsx — DONE (TX object passed to DownloadPdfButton as prop, localePath links)
- NotFound.tsx — DONE
- SampleReport.tsx — DONE (UI chrome translated; sample clause data stays Slovak, EN banner notes findings are in Slovak)
- (was FreeSken plan) — OBSOLETE: pattern = inline `const tx = locale === "en" ? {...} : {...}` object like About.tsx; strings: Bezplatný náhľad, Výsledky analýzy, risk labels, Top 3 riziká, + X ďalších nálezov, Chcete plný report?, Pokračovať k platbe, Garancia..., Čo obsahuje plný report? (6 items), Zobraziť plný report, loading/notfound states. Also wrap Links with localePath().
- VOP.tsx, GDPR.tsx, Cookies.tsx — legal pages: add small EN notice banner when locale=en ("This legal document is available in Slovak only" / legally binding version is Slovak). Do NOT translate full legal text.
- English PDF report generation — pdf-export.ts: add ?lang=en query param support, translate PDF section labels (title, risk summary, findings, legal basis, suggested edit, lawyer note, disclaimer, QR section). Frontend DownloadPdfButton should append `?lang=${locale}`.
- AI executive summary in PDF — separate todo item, still open (todo.md line 106).
- NotificationBell.tsx — check for Slovak strings
- Verify tests pass (pnpm test), take screenshots of / and /en, checkpoint, deliver.

## Verified
- Screenshots of / and /en look correct (hero, stats, nav translated)
- Dev server running clean, no TS errors after upload keys added

## Notes
- PRICING_PLANS from @shared/types has nameSk + features (Slovak); EN uses t.pricing.* arrays instead
- plan.delivery is Slovak "do 24 hodín" — EN uses t.pricing.basicTime
- todo.md has "## English Version (i18n)" section with [ ] items to mark complete
