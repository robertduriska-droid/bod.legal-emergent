# Slov-Lex & Legal Source Integration Reference

## Overview

The AI contract analysis must ground its findings in actual Slovak/EU legal norms from official sources. This ensures every risk finding cites the relevant legal instrument and section.

## Primary Sources (Authority Order)

1. **EU law and CJEU case law** where directly relevant
2. **Slovak statutes and regulations** from Slov-Lex
3. **Slovak regulator guidance**
4. **Slovak court decisions** (Najvyšší súd SR, Ústavný súd SR)
5. **Secondary commentary** (non-binding support only)

## Core Legal Instruments for Contract Analysis

| ID | Name | Instrument | Source | URL |
|---|---|---|---|---|
| civil_code | Civil Code | Act No. 40/1964 Coll. | Slov-Lex | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/ |
| commercial_code | Commercial Code | Act No. 513/1991 Coll. | Slov-Lex | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/ |
| public_procurement | Public Procurement Act | Act No. 343/2015 Coll. | Slov-Lex | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/ |
| personal_data_protection | Personal Data Protection Act | Act No. 18/2018 Coll. | Slov-Lex | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2018/18/ |
| consumer_protection | Consumer Protection Act | Act No. 108/2024 Coll. | Slov-Lex | https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2024/108/ |
| gdpr | GDPR | Regulation (EU) 2016/679 | EUR-Lex | https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng |
| ai_act | AI Act | Regulation (EU) 2024/1689 | EUR-Lex | https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng |
| eidas | eIDAS | Regulation (EU) No 910/2014 | EUR-Lex | https://eur-lex.europa.eu/eli/reg/2014/910/oj/eng |

## Risk Taxonomy Categories

1. **authority_parties** (high) - Parties and signing authority
2. **dates_effectiveness** (high) - Dates, effectiveness, and term
3. **price_payment** (high) - Price, payment, and value
4. **scope_performance** (medium) - Scope and performance
5. **liability_indemnity** (high) - Liability and indemnity
6. **privacy_security** (high) - Privacy and security
7. **public_procurement_crz** (high) - Public procurement and CRZ
8. **governing_law_disputes** (medium) - Governing law and disputes

## Contract Types Supported

- public_crz, framework_services, lease_real_estate, financing_debt
- corporate_governance, data_privacy_security, purchase_supply
- works_services, advisory_consulting, settlement_coordination
- employment_hr, other

## Answering Rules for AI Analysis

- Cite the exact legal instrument and section where possible
- State if the cited text may have changed
- Prefer official Slovak language text for Slovak statutes
- Do not treat regulator guidance as binding statute
- Do not treat one court decision as generally binding precedent
- If official sources are unavailable, the answer must say so
- Never invent Slovak case law or statutory provisions

## CRZ Integration

The CRZ (Centrálny register zmlúv) corpus provides:
- 544 real Slovak public contracts with metadata
- Contract type classification data
- Legal complexity scoring signals
- Prospect intelligence for commercial outreach
