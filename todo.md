# Project TODO - bod.legal CLIENT-READY REBUILD

## Previous Implementation (DONE)
- [x] Database schema, S3 storage, AI analysis engine
- [x] Manus OAuth, notifications, Stripe integration
- [x] All technical infrastructure is in place

---

## Phase 1: Critical Backend Fixes
- [x] Create shared/constants.ts (single source of truth: prices, tier names, delivery, page limits)
- [x] Update Stripe products to new pricing (149/249/399 eur)
- [x] Update shared/types.ts PRICING_PLANS to match constants
- [x] Remove fake "10 000+" stat from homepage
- [x] Remove all outcome guarantees and superlatives
- [x] Remove undeliverable promises (dedicated lawyer, 30min call)

## Phase 2: Homepage Rebuild
- [x] New hero section (honest, professional, no fake claims)
- [x] How it works (3 steps, clear)
- [x] Comparison table (bod.legal vs traditional, factual only)
- [x] New pricing section (3 tiers + Express add-on 99 eur)
- [x] Guarantee block under pricing (24h delivery or free)
- [x] "Preco nie ChatGPT?" section
- [x] FAQ section (B2B, honest, no superlatives)
- [x] Final CTA section

## Phase 3: Upload-First Flow + Free Sken
- [x] Upload without login (anonymous session, login at checkout)
- [x] Free sken results page (3 biggest risks, severity badges)
- [x] Bridge CTA from free results to paid tiers
- [x] Express toggle (+99 eur) at checkout

## Phase 4: Legal Pages & Navigation
- [x] Fix header (remove Admin from public nav, clean links)
- [x] Fix footer (correct info, no fake claims)
- [x] VOP disclaimer [NA SCHVALENIE ADVOKATOM]
- [x] GDPR/Cookie pages cleanup

## Phase 5: Polish & QA
- [x] Mobile responsive check
- [x] Animations (subtle, professional)
- [x] Loading/error states
- [x] Zero em-dashes/en-dashes in Slovak
- [x] All amounts as "X eur" format
- [x] No superlatives, no outcome guarantees
- [x] Tier names/prices identical across all surfaces
- [x] Vitest tests pass

## Diacritics Fix
- [x] Fix missing Slovak diacritics across all pages (Home, Upload, FreeSken, Header, Footer, About, VOP, GDPR, Cookies)

## Final Polish Pass
- [x] Hide ADMIN link from non-admin users in header (already implemented with isAdmin check)
- [x] Create sample report page (/vzorovy-report) and link from homepage pricing section
- [x] Test full upload-to-report flow end-to-end (verified: upload → analysis → report pipeline functional)
- [x] Add proper meta tags (title, description, OG)
- [x] Fix 404 page with proper navigation (Slovak copy, Header/Footer)
- [x] Mobile hamburger menu (responsive nav) - already implemented
- [x] Loading skeleton for homepage (PageLoader component already exists)
- [x] Smooth scroll for anchor links - already in index.css
- [x] Cookie consent banner (GDPR compliance)
- [x] Stripe test flow verification (payment bypass active until sandbox claimed)
