# bod.legal — working brief

Standing context for anyone (human or agent) working in this repo. Read sections
1 to 3 before any task. Work the backlog in section 4 in priority order.

- `[SAK GATE]` = drafted but MUST NOT go live until Robert confirms Michal Kilian / SAK sign-off.
- `[ROBERT DECIDES]` = open decision. Do not auto-resolve. Build so it can be swapped.

Section 8 records where this brief conflicts with what is actually built. Read it
before trusting any assumption here.

---

## 1. Product context

bod.legal is an AI contract-review service operated under **KILIAN LEGAL s.r.o.**
(principal: **JUDr. Michal Kilian**). It is a productized extension of the firm,
not a standalone software product. Robert Duriska is a koncipient and cannot sign
as advokát; the signing advokát is Kilian.

- **What it does:** AI reviews a contract clause by clause, personal data is redacted before processing, an SAK-registered advokát verifies and signs the result, delivered within 24h at a fixed price.
- **Market:** Slovakia. All client-facing copy is Slovak. English is a parallel version, same Slovak law.
- **Buyer:** B2B konateľ and agencies. Not consumers, not residential.
- **Flagship deliverable:** clause report + advokát verification + suggested edits, **249 eur**, up to 20 pages. **Redline is NOT in the flagship** (decided 2026-07-16, amends the original brief): the redline document, non-standard/complex contracts and up to 50 pages are what **Prémium 490 eur** adds. Express is a +127 eur add-on.
- **Ladder:** free AI scan (lead magnet) → Express upsell → bundle → negotiation-to-signature add-on → subscription 449 eur/mesiac (founding rate 349 eur for the first 20).
- **Growth:** lead-getters (accountants, invoicing platforms), not paid social.
- **Reference model:** general.legal (AI first pass, licensed attorney signs, flat-fee productized menu, free template funnel).

Scaling constraints are structural, not unit-economic: advokát verification time
gates throughput, lead-getter breadth gates volume, and the subscription only
fits high-contract-velocity buyers. **Do not build features that assume infinite
advokát capacity or heavy recurring usage from low-velocity users.**

## 2. Non-negotiables

1. **The advokát signature is the moat.** Every paid deliverable is verified and signed by an SAK-registered advokát, and that sign-off is visible in the output. Never ship a paid deliverable without it. Never blur AI-only output and advokát-verified output.
2. **Redact personal data before any AI call.** PII redaction happens upstream of the model. Never send un-redacted client data to an external model. Surface it to the client as a trust feature only once it is real. **(Implemented, see §8.1.)**
3. **`[SAK GATE]` on anything regulated:** published fixed-fee price menu, any comparison-to-a-lawyer framing, guarantee wording, subscription and auto-renewal terms, referral / fee-share with non-lawyer lead-getters. Build behind a flag or mark `DRAFT — SAK REVIEW PENDING`.
4. **No fabricated proof.** No invented accuracy percentages, testimonials, logos, review counts, or scarcity. Only real, earned numbers. If a metric is not measured, omit it. Never claim membership of a bar we are not in.
5. **Stay narrow.** One job (pre-signature contract review), one jurisdiction, one buyer. No horizontal "legal OS". Reject scope creep into consumer/residential, litigation, general practice.
6. This brief is not legal advice. `[SAK GATE]` items defer to Kilian / SAK.

## 3. Slovak copy conventions

Apply to every Slovak string:

- **No dashes.** No em-dash, no en-dash. Use commas, parentheses, or separate sentences.
- **English terms:** Slovak first, English in parentheses, e.g. `predplatné (subscription)`.
- **Money:** period as thousands separator, word `eur`. e.g. `249 eur`, `449 eur/mesiac`, `1.000 eur`.
- **Deliverables are finished and branded.** Real copy, never lorem ipsum or outlines.
- **Severity labels in reports:** `červené` (high), `oranžové` (medium). (See §8.4: code currently uses different labels.)

## 4. Backlog

### P0
- **P0.1 Decision-ready package.** Paid output = 4 parts in order: (1) one-page plain-Slovak executive risk top sheet, severity-ranked, "toto sú 3 veci, ktoré ti môžu uškodiť, a čo s každou z nich urobiť"; (2) redline with Word formatting intact; (3) drafted counterparty email; (4) visible `skontroloval a podpísal: [meno advokáta], SAK reg. [X]`. **Accept:** konateľ reads the top sheet in under 5 minutes and knows what to worry about and what to do; redline opens cleanly in Word; sign-off on every paid package.
- **P0.2 Safe guarantee.** `[SAK GATE]` Draft: `Hotové do 24 hodín, alebo zadarmo` and/or a clarity guarantee. Never guarantee outcomes.
- **P0.3 Name the flagship.** One benefit-driven name site-wide: `Zmluvný audit` or `Kontrola pred podpisom`.
- **P0.4 Free scan = structured instant self-serve report.** Severity-ranked flag list, short grounded reason per flag (`nezvyčajné, pretože ...`), labelled `len AI, bez podpisu advokáta`, paid package as the upgrade.

### P1
- **P1.1** Publish fixed-fee menu + 4-step process. `[SAK GATE]`
- **P1.2** Downsell tier: AI-only report ~79 to 99 eur, clearly inferior, A/B with cannibalisation tracking.
- **P1.3** Cross-document consistency check across related uploads.
- **P1.4** Optional parallel English version when the counterparty is foreign.
- **P1.5** Prominent privacy/trust block: PII redaction, `vaše zmluvy nikdy nepoužívame na trénovanie`. Security posture only once real.

### P2
- **P2.1** Client dashboard: contracts, status (`prijaté → u advokáta → hotové`), drop next contract.
- **P2.2** Learned house playbook after N reviews. Honest justification for the subscription.
- **P2.3** Annual prepaid credit pack for low-velocity konateľ.
- **P2.4** Negotiation version tracker, round-by-round `čo sa zmenilo`.

## 5. Open decisions — do not auto-resolve

- **`[ROBERT DECIDES]` Redline engine: build vs buy.** Keep `.docx` tracked-changes generation modular behind an interface so the engine can be swapped. Do not hard-wire. (See §8.7.)
- **Subscription targeting.** 449 eur/mesiac fits high-velocity avatars (agencies, brokers, staffing, e-commerce, real estate). Sell the one-off audit to everyone else.
- **`[SAK GATE]` Lead-getter referral structure.** SAK may restrict fee-sharing with non-lawyers. Do not build revenue-share payout as a hard dependency.

## 6. Definition of done

- [ ] Every paid deliverable carries the visible advokát sign-off.
- [ ] PII redacted before any external model call.
- [ ] Slovak copy follows §3 (no dashes, EN in parentheses, `eur` format).
- [ ] Nothing marked `[SAK GATE]` is live without Kilian / SAK confirmation.
- [ ] No fabricated metrics, testimonials, or scarcity.
- [ ] Free (AI-only) vs paid (advokát-verified) unambiguous to the user.

## 7. Out of scope

Consumer/residential flows. Litigation or general practice. A horizontal legal OS.
Continuity features assuming heavy recurring usage from low-velocity buyers. Any
client-facing legal claim or comparison not cleared by Kilian / SAK.

---

## 8. Reality check — where this brief conflicts with the build

Recorded 2026-07-16 against the live deployment at **https://app.bod.legal**
(Railway, EU West, branch `selfhost`). Verified in code, not assumed.

### 8.1 PII redaction — SHIPPED 2026-07-16 (was violated in production)
`server/redact.ts` scrubs personal data before any external model call. Patterns
are ported from the predecessor Python tool (`~/Dolozka/dolozka_engine.py`):
IBAN, rodné číslo, e-mail and telefón are replaced outright; IČO, DIČ and IČ DPH
keep their label and lose the value; party names can be scrubbed on request.

Wired into `buildAnalysisRequest` in `server/analysis.ts`, the single choke point
where contract text enters a model request, so no code path can bypass it, and
into `server/assistant.ts` for attachment text. Redaction runs before truncation
so counts describe the whole document. Counts are logged, values never are.

**Ordering matters:** LABELLED patterns run BEFORE PATTERNS. A Slovak
`IČ DPH: SK2121545919` also matches the IBAN shape, so IBAN first would swallow
the VAT number and mislabel it `[IBAN]`. The Python original still has this bug.

Verified on production with a contract carrying real PII shapes: nothing leaked,
and the analysis quality held (§ 574 ods. 2 OZ, § 544 a nasl., § 536 a nasl. ObZ).
`server/redact.test.ts` asserts no PII survives into the outgoing prompt.

Until this was shipped, every contract, including anonymous free scans, reached
OpenRouter in full. The site never claimed redaction, so no false statement went
out. P1.5's trust block is now truthful and may ship.

### 8.2 Pricing RESOLVED (2026-07-16)
Robert decided: free scan (0 eur) / **Štandardná 249 eur** (was 297) / **Prémiová
490 eur** / Express +127 eur. Changed in all 20 places incl. VOP and tests.

Two decisions that amend the original brief:
- the **249 flagship does NOT include the redline**. Redline stays a Prémium
  feature (`includesRedline: false` on standard, `true` on premium).
- **Prémium 490 justifies itself with scope, not redline alone**: bigger
  (up to 50 pages) and non-standard/complex contracts.

Still open: the **449 eur/mesiac subscription** does not exist in the app (there
is only a 15-day trial in `Trial.tsx` via Stripe SetupIntent), and the flagship
has no container name yet (see §8.5).

### 8.3 `[SAK GATE]` items are already published
Live on app.bod.legal right now, none behind a flag:
- public fixed-fee price list,
- comparison table `bod.legal vs tradičná advokátska kancelária`,
- guarantee `Ak report nedodáme v sľúbenej lehote, neplatíte nič`.

Per non-negotiable #3 these needed sign-off before publish. They are already out.

### 8.4 Severity labels differ
Brief wants `červené` / `oranžové`. Code uses `high|medium|low` mapped to
`Vysoké|Stredné|Nízke`, and the analysis schema adds `critical|important|minor`
rendered as `kritické|dôležité|drobné` (`server/analysis.ts`, `Report.tsx`).

### 8.5 Flagship is unnamed
No `Zmluvný audit` / `Kontrola pred podpisom` container name. Tiers are
`Štandardná kontrola` / `Prémiová kontrola`.

### 8.6 Advokát identity is a placeholder
`client/src/lib/advokat.ts` ships empty, so the sign-off renders generic wording
instead of `skontroloval a podpísal: [meno], SAK reg. [X]`. It must hold
**Michal Kilian's** name and SAK number (he signs; Robert is a koncipient).

### 8.7 Redline engine is hard-wired
`server/docx-export.ts` calls the `docx` npm package directly. There is no
interface to swap in a licensed engine, contrary to §5.

### 8.8 Free scan does not label itself AI-only
The free preview gates content (`isLimited`) and never claims verification, but it
does not carry the explicit `len AI, bez podpisu advokáta` label from P0.4.

### 8.9 Scope: CZ and HU are parked
Only `sk` and `en` are live (`ENABLED_LOCALES` in `client/src/i18n/index.ts`),
because one SAK advokát signs everything, so the whole chain runs under Slovak
law. `cz.ts` / `hu.ts` and their prompts stay in the repo, switched off. When the
governing law is not Slovak the report must state it is an AI analysis **without**
advokát verification and cite EU law only.

### 8.10 Operational gaps blocking the first paid matter
Stripe, Google OAuth and SendGrid keys are not set, so nobody can pay, log in, or
receive a report by email. `APP_BASE_URL` still points at the old Railway URL.
Railway is on trial credit and the app goes offline when it runs out.
