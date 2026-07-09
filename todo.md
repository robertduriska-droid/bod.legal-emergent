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
- [ ] Free sken results page (3 biggest risks, severity badges)
- [ ] Bridge CTA from free results to paid tiers
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
