# Project TODO - bod.legal

## Foundation
- [x] Database schema (contracts, clauses, reports tables)
- [x] Google Fonts (DM Serif Display + DM Sans)
- [x] Theme/CSS variables matching bod.legal aesthetic

## Landing Page (Slovak)
- [x] Header with nav, language toggle (SK/EN), login/register buttons
- [x] Hero section with dark background
- [x] Stats bar (24h, 10000+, od 149€)
- [x] How-it-works steps (3 steps)
- [x] Security trust signals (4 cards)
- [x] Comparison table (bod.legal vs traditional lawyer)
- [x] Pricing section (4 tiers: Legal Audit, €149, €349, €749)
- [x] FAQ accordion
- [x] CTA section
- [x] Footer with legal links

## Authentication
- [x] Login/signup via Manus OAuth
- [x] Language toggle (SK/EN)
- [x] Protected routes for dashboard/upload

## Contract Upload Flow
- [x] Upload page with PDF/DOCX file picker
- [x] Pricing plan selection during upload
- [x] S3 file storage for uploaded contracts
- [x] Contract submission with metadata saved to DB

## AI Contract Analysis
- [x] LLM-powered clause-by-clause analysis
- [x] Risk detection (high/medium/low)
- [x] Structured report generation in Slovak
- [x] Missing provisions identification
- [x] Redline edit suggestions

## User Dashboard
- [x] List of submitted contracts with status tracking
- [x] Status states: pending → in review → completed
- [x] Link to view report when completed

## Lawyer Admin Panel
- [x] Admin view of all submitted contracts
- [x] Review AI findings
- [x] Add annotations to clauses
- [x] Approve/override findings
- [x] Mark report as lawyer-signed

## Report View & Download
- [x] Completed report page for users
- [x] Structured risk findings display
- [x] Download report functionality

## Notifications
- [x] Instant owner notification on new contract submission

## Legal & About Pages
- [x] VOP (Terms of Service)
- [x] GDPR policy
- [x] Cookies policy
- [x] AI Act disclosure
- [x] About page (O nás) with Kilian Legal info

## Slov-Lex & Legal Source Integration
- [x] Legal sources reference data (Slovak/EU instruments with URLs)
- [x] Risk taxonomy integration in AI analysis prompts
- [x] Citation of legal norms in clause findings
- [x] Slov-Lex URL references in report output
- [x] CRZ contract intelligence data seeding

## Testing
- [x] Vitest tests for contract procedures
- [x] Vitest tests for analysis flow
