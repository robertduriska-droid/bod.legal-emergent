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
