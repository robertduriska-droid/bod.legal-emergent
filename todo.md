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

## Final Production Pass
- [x] Fix payment flow: basic plan runs free preview immediately, standard/premium wait for Stripe webhook
- [x] Fix getStatus: return paid=false for pending contracts (test bypass removed)
- [x] Remove "audit" from drizzle schema plan enum (migration applied)
- [x] Add "basic" plan free sken: run analysis immediately for basic (free preview), gate full report behind payment
- [x] Verify ContractDetail payment gate works correctly
- [x] Add proper error boundaries and fallbacks (ErrorBoundary already exists in template)
- [x] Final vitest run (15/15 passing)
- [x] Remove IMPLEMENTATION_NOTES.md
- [x] Gate full report access for basic plan (server-side: return only 3 clauses, isLimited flag)
- [x] Report.tsx: show upgrade CTA for basic plan users
- [x] Dashboard: fix link routing (basic completed -> preview, not full report)
- [x] Dashboard: remove stale 'Legal Audit' label

## Final All-In-One Pass
- [x] Add Google Reviews section to homepage (70 reviews, 5.0 rating from KILIAN LEGAL)
- [x] Remove VOP disclaimer banners (all 3 pages: VOP, GDPR, Cookies)
- [x] Upgrade sample report page with more realistic content (already has 5 detailed clauses)
- [x] Add structured data (JSON-LD) for LegalService + AggregateRating
- [x] Add WhatsApp/phone contact floating button
- [x] Add robots.txt and sitemap.xml
- [x] Final visual QA and tests (15/15 passing, 0 TS errors)

## Visual Upgrade
- [x] Replace placeholder icons in "Ako to funguje" section with realistic report visuals (upload mockup, analysis preview, final report preview)

## Demo Video
- [x] Create animated demo (CSS/JS looping animation) showing the full upload-to-report flow
- [x] Add it below the hero section on the homepage

## Interactivity
- [x] Hover zoom effect (scale 110%) + magnifier icon overlay on "Ako to funguje" image cards
- [x] Lightbox overlay: click any card to open full-screen image view with X close button
- [x] Play/pause controls and step navigation for DemoAnimation

## PDF Export
- [x] Server-side PDF generation endpoint (/api/contracts/:id/report.pdf)
- [x] Download PDF button on Report page (replaces window.print())
- [x] Success/error toast notifications on PDF download button
- [x] Add bod.legal diagonal watermark to every PDF page
- [x] Add QR code linking to online report on last page of PDF
- [x] AI-generated executive summary section at top of PDF report
- [x] Splash/intro animation with large bod.legal logo on dark background before scroll

## English Version (i18n)
- [x] i18n translation system with sk/en locale files
- [x] Language routing (/en/* prefix for English)
- [x] Language switcher in header
- [x] English translations for main pages (Home, About, Upload, Dashboard) + components (Header, Footer, Splash, Cookies banner, Demo, FloatingContact)
- [x] English splash intro (tagline via i18n)
- [x] English translations for app pages (Report, ContractDetail, FreeSken, NotFound) - full UI translation
- [x] SampleReport: English UI chrome (headings, labels, CTA); sample clause content stays Slovak (illustrative data)
- [x] VOP, GDPR, Cookies: English title + notice banner ("legally binding text is Slovak"); body stays Slovak by design
- [x] NotificationBell component translated
- [x] English PDF report generation (lang=en query param, all labels translated)

## DOCX Export with Track Changes
- [x] Server-side DOCX generation endpoint (/api/contracts/:id/report.docx)
- [x] Track changes (revisions) for suggested edits in DOCX
- [x] Download DOCX button on Report page
- [x] Tests for DOCX export endpoint

## Motto & EN Equivalence
- [x] Add "Dôvera. Rýchlosť. Výsledky." motto to SK homepage/splash
- [x] Add "Trust. Speed. Results." motto to EN homepage/splash
- [x] Ensure EN version is precise linguistic equivalent of SK version

## Brand Presence Enhancement
- [x] Subtle "bod.legal" watermark text in hero section background (3% opacity, 22rem)
- [x] Brand mark in section dividers (between FAQ and Reviews)
- [x] Oversized "bod.legal" watermark in CTA section background
- [x] Oversized "bod.legal" watermark in footer background

## Redline Preview
- [x] In-browser redline view showing tracked changes (deletions strikethrough red, insertions underline green) before DOCX download

## Accept/Reject Changes
- [x] Per-clause accept/reject buttons with visual state (accepted=green confirmed, rejected=red dismissed)
- [x] Global "Accept all" and "Reject all" buttons
- [x] Visual feedback: accepted clauses show final text only, rejected show original only
- [x] Counter showing X/Y decisions made
- [x] "Download final version" button that generates clean DOCX with only accepted changes applied (no track changes markup)

## Persist Clause Decisions
- [x] Add clause_decisions table (userId, clauseId, contractId, decision: accepted|rejected)
- [x] DB helpers: getDecisionsByContractAndUser, upsertDecision, bulkUpsertDecisions, deleteDecision
- [x] tRPC procedures: decisions.getByContract, decisions.save, decisions.saveAll, decisions.remove
- [x] Report.tsx: load saved decisions on mount, auto-save on accept/reject/undo
- [x] Tests for decisions procedures (7 tests passing)

## Email Notifications
- [x] Send notification to user when report analysis is completed and ready for download (already existed + added owner push)
- [x] Send notification to owner/admin when new contract is submitted (already existed)

## Admin Lawyer Review Dashboard
- [x] Admin-only page listing contracts pending lawyer review (status: in_review) — AdminPanel.tsx
- [x] Per-contract review interface: view clauses, add annotations, approve/override risk levels — AdminReview.tsx
- [x] Mark report as signed (isSigned + lawyerName) — signReport mutation
- [x] Status transitions: analyzing → in_review → completed — startReview + signReport

## Side-by-Side Comparison
- [x] Toggle between inline redline view and side-by-side (two-column) comparison
- [x] Left column: original text, Right column: suggested edit
- [x] Visual diff highlighting between columns

## Clause-Level Comments
- [x] DB table: clause_comments (id, contractId, clauseId, userId, userName, content, createdAt)
- [x] tRPC procedures: comments.getByContract, comments.add, comments.delete
- [x] Report page UI: comment input per clause, display existing comments with timestamps
- [x] AdminReview page: display user comments visible to reviewing lawyer
- [x] Full SK + EN i18n labels for comments feature
- [x] Tests for comment tRPC procedures

## Copy Updates: File Limits & Language Support
- [x] Update homepage/upload text: PDF a DOCX do 50 MB, slovenčina a angličtina, slovenské právo
- [x] Update upload page file validation to reflect 50 MB limit and PDF/DOCX only (already correct)
- [x] Update any FAQ or info sections with correct file/language parameters

## Email Notifications
- [x] Send owner notification when report analysis is completed (already existed in analysis.ts)
- [x] Send owner notification when a new comment is added to a clause
- [x] Include contract name, clause reference, and direct link in notification

## Lawyer Reply Thread
- [x] Allow admin/lawyer to reply to comments in AdminReview
- [x] Display replies threaded under the original comment (parentId + isLawyer fields)
- [x] Show replies in Report page (user-facing) as lawyer responses with badge
- [x] Full SK+EN i18n for reply UI

## Stripe Checkout Flow
- [x] Define products/prices in products.ts (Basic, Standard, Premium plans) - already existed
- [x] Create checkout session endpoint with user metadata - already existed
- [x] Webhook handler for checkout.session.completed - already existed, enhanced
- [x] Store stripe_customer_id on user (subscription tracking deferred — not needed for per-contract checkout model)
- [x] Frontend: redirect to Stripe Checkout on plan selection - already existed
- [x] Payment success/cancel toast notifications on ContractDetail page
- [x] Test instructions for user (4242 card, claim sandbox)

## Phase 0 Copy Deck - BOD Contract Intelligence Repositioning
- [ ] Meta/title/OG: "bod.legal | Zmluvná pamäť firmy · Kontrola zmlúv s podpisom advokáta"
- [ ] Nav: Contract Intelligence, Sprint, Cenník, O nás, EN, Prihlásiť sa, [Vybudovať zmluvnú pamäť]
- [ ] Hero: new H1, subtitle, mechanism line, dual CTA, microcopy
- [ ] Trust bar: SAK, 10.000+ docs, EÚ dáta (replace 24h/149€)
- [ ] Section 5: Zmluvná amnézia (problém) with definition box
- [ ] Section 6: BOD slučka zmluvnej pamäte (6 steps, text list for Phase 0)
- [ ] Section 7: Pred BOD / Po BOD comparison table
- [ ] Section 8: Sprint (flagship 30-day implementation)
- [ ] Section 9: Cenník (3 tiers: Check 149€, Sprint 8000€, Desk 1000€/mo + Playbook Lite 2500€)
- [ ] Section 10: Pre koho (qualification/disqualification)
- [ ] Section 11: Skóre (lead magnet, simple form for Phase 0)
- [ ] Section 12: Bezpečnosť (keep existing, move lower)
- [ ] Section 13: FAQ (keep 4, add 4 new)
- [ ] Section 14: Záverečné CTA
- [ ] Section 15: Footer (keep, add new links)
- [ ] Full EN translation for all new sections

## SendGrid Email Integration
- [x] Configure SendGrid API key and from email (robert.duriska@kilian.legal)
- [x] Create email service module (server/email.ts) with branded HTML templates
- [x] Email client when AI analysis completes (report ready)
- [x] Email lawyer when new contract needs review (paid plans)
- [x] Email client when lawyer completes review (signReport)
- [x] Validate SendGrid API key via test

## Contract Status Indicator
- [x] Visual status badge on client dashboard (Moje zmluvy) showing: pending, analyzing, in_review, completed
- [x] Color-coded with descriptive SK/EN text for each state (progress bar with icons)

## Progress Bar
- [x] Add step-based progress bar to Dashboard contract cards showing current stage in the workflow

## Czech (CZ) Localization
- [x] Create cz.ts i18n file with full Czech translations
- [x] Convert EUR pricing to CZK (approx 25.3 rate: 149€→3 770 Kč, 2500€→63 250 Kč, 8000€→202 400 Kč, 1000€→25 300 Kč)
- [x] Update i18n system to support 3 locales (sk, cz, en)
- [x] Add /cz/ route prefix (detectLocaleFromPath + stripLocalePrefix)
- [x] Update language switcher to SK | CZ | EN (3-button group)
- [x] Add Czech legal sources to AI analysis prompt (NOZ 89/2012, ZOK 90/2012, zákonyprolidi.cz, smlouvy.gov.cz)
- [x] CZ entries in all page-level TX objects (Report, SampleReport, FreeSken, ContractDetail, AdminReview, NotFound, NotificationBell)
- [x] Language-aware system prompt selection based on contract.language field

## Jurisdiction Filter on Dashboard
- [x] Add SK/CZ/All filter toggle on client Dashboard to filter contracts by language/jurisdiction

## CZK Pricing on Dashboard
- [x] Show prices in CZK for Czech contracts on Dashboard (plan labels with CZK amounts, date in cs-CZ locale)

## AI Output Language by Jurisdiction
- [x] Ensure AI analysis output is generated in Slovak for SK contracts and Czech for CZ contracts (already in place via SYSTEM_PROMPTS per language)

## Pricing Update (Marketing-Friendly)
- [x] Update EUR prices: 197€ / 297€ / 497€ / +127€ express
- [x] Update CZK prices: 4 990 Kč / 7 490 Kč / 12 490 Kč / +3 190 Kč express
- [x] Update all places: stripe-products.ts, Dashboard, i18n (sk, cz, en), VOP, Report.tsx

## Client Experience Improvements (110%)
- [x] Fix Upload page CTA: show CZK for CZ locale instead of hardcoded "eur"
- [x] Add trust signals (lock icon + advokátska mlčanlivosť) near payment CTA on Upload page
- [x] Improve ContractDetail waiting states: add ETA, reassurance copy, progress steps
- [x] Dashboard: contextual CTA per status (not just generic "View")
- [x] Notify client (in-app) when lawyer replies to their comment (already implemented in routers.ts + added icon/deep-link in NotificationBell)
