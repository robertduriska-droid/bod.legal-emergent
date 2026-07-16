// ─── Contract Types ─────────────────────────────────────────────────────────

export type ContractPlan = "basic" | "standard" | "premium";
export type ContractStatus = "pending" | "analyzing" | "in_review" | "completed";
export type RiskLevel = "high" | "medium" | "low";

export type ContractType =
  | "public_crz"
  | "framework_services"
  | "lease_real_estate"
  | "financing_debt"
  | "corporate_governance"
  | "data_privacy_security"
  | "purchase_supply"
  | "works_services"
  | "advisory_consulting"
  | "settlement_coordination"
  | "employment_hr"
  | "other";

// ─── Legal Source Types ─────────────────────────────────────────────────────

export interface LegalSource {
  id: string;
  name: string;
  instrument: string;
  source: "Slov-Lex" | "EUR-Lex";
  url: string;
}

export interface RiskCategory {
  id: string;
  severity: RiskLevel;
  label: string;
  labelSk: string;
  checks: string[];
}

// ─── Analysis Output Types ──────────────────────────────────────────────────

export interface ClauseAnalysis {
  clauseNumber: number;
  title: string;
  excerpt: string;
  riskLevel: RiskLevel;
  finding: string;
  suggestedEdit?: string;
  legalBasis?: string;
  legalSourceUrl?: string;
  riskCategory?: string;
}

export interface DeepFinding {
  title: string;
  detail: string;
}

export interface AnalysisResult {
  contractType: ContractType;
  clauses: ClauseAnalysis[];
  summary: string;
  recommendation: string;
  riskSummary: { high: number; medium: number; low: number };
  applicableLegalSources: LegalSource[];
  /** Deep analysis (Mike OS) — optional richer second-pass fields */
  dealBreakers?: DeepFinding[];
  missingProvisions?: DeepFinding[];
  verificationNotes?: string;
  riskScore?: number;
}

// ─── Pricing Plan Details ───────────────────────────────────────────────────

export interface PricingPlan {
  id: ContractPlan;
  name: string;
  nameSk: string;
  price: number; // in EUR (not cents)
  priceLabel: string; // display string e.g. "149 eur"
  delivery: string;
  maxPages: number;
  features: string[];
  includesLawyer: boolean;
  includesRedline: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Free Scan",
    nameSk: "Bezplatný sken",
    price: 0,
    priceLabel: "zadarmo",
    delivery: "výsledok o pár minút",
    maxPages: 30,
    features: [
      "AI sken celej zmluvy",
      "Top 3 riziká zadarmo",
      "Bez prihlásenia, bez karty",
      "Do 30 strán",
    ],
    includesLawyer: false,
    includesRedline: false,
  },
  {
    id: "standard",
    name: "Standard Review",
    nameSk: "Štandardná kontrola",
    price: 249,
    priceLabel: "249 eur",
    delivery: "do 24 hodín",
    maxPages: 50,
    features: [
      "Všetko zo Základnej kontroly",
      "Overenie advokátom (SAK)",
      "Návrhy konkrétnych úprav",
      "Prioritná podpora",
      "Do 50 strán",
    ],
    includesLawyer: true,
    includesRedline: false,
  },
  {
    id: "premium",
    name: "Premium Review",
    nameSk: "Prémiová kontrola",
    price: 497,
    priceLabel: "497 eur",
    delivery: "do 24 hodín",
    maxPages: 100,
    features: [
      "Všetko zo Štandardnej kontroly",
      "Redline dokument s navrhovanými úpravami",
      "Zložitejšie a neštandardné zmluvy",
      "Analýza pozície oboch strán",
      "Do 100 strán",
    ],
    includesLawyer: true,
    includesRedline: true,
  },
];

// Express add-on (not a standalone plan)
export const EXPRESS_ADDON = {
  price: 127,
  priceLabel: "+127 eur",
  delivery: "do 4 hodín",
  description: "Prioritné spracovanie do 4 hodín namiesto 24",
};

// ─── Legal Sources Reference Data ───────────────────────────────────────────

export const LEGAL_SOURCES: LegalSource[] = [
  {
    id: "civil_code",
    name: "Občiansky zákonník",
    instrument: "Zákon č. 40/1964 Zb.",
    source: "Slov-Lex",
    url: "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/",
  },
  {
    id: "commercial_code",
    name: "Obchodný zákonník",
    instrument: "Zákon č. 513/1991 Zb.",
    source: "Slov-Lex",
    url: "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/",
  },
  {
    id: "public_procurement",
    name: "Zákon o verejnom obstarávaní",
    instrument: "Zákon č. 343/2015 Z. z.",
    source: "Slov-Lex",
    url: "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/",
  },
  {
    id: "personal_data_protection",
    name: "Zákon o ochrane osobných údajov",
    instrument: "Zákon č. 18/2018 Z. z.",
    source: "Slov-Lex",
    url: "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2018/18/",
  },
  {
    id: "consumer_protection",
    name: "Zákon o ochrane spotrebiteľa",
    instrument: "Zákon č. 108/2024 Z. z.",
    source: "Slov-Lex",
    url: "https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2024/108/",
  },
  {
    id: "gdpr",
    name: "GDPR",
    instrument: "Nariadenie (EÚ) 2016/679",
    source: "EUR-Lex",
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng",
  },
  {
    id: "ai_act",
    name: "AI Act",
    instrument: "Nariadenie (EÚ) 2024/1689",
    source: "EUR-Lex",
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
  },
  {
    id: "eidas",
    name: "eIDAS",
    instrument: "Nariadenie (EÚ) č. 910/2014",
    source: "EUR-Lex",
    url: "https://eur-lex.europa.eu/eli/reg/2014/910/oj/eng",
  },
];

// ─── Risk Taxonomy ──────────────────────────────────────────────────────────

export const RISK_CATEGORIES: RiskCategory[] = [
  {
    id: "authority_parties",
    severity: "high",
    label: "Parties and signing authority",
    labelSk: "Zmluvné strany a oprávnenie na podpis",
    checks: ["missing party identity", "ambiguous party role", "missing signing authority", "unmatched company identifiers"],
  },
  {
    id: "dates_effectiveness",
    severity: "high",
    label: "Dates, effectiveness, and term",
    labelSk: "Dátumy, účinnosť a trvanie",
    checks: ["missing effective date", "contradictory dates", "unclear expiry", "automatic renewal without controls"],
  },
  {
    id: "price_payment",
    severity: "high",
    label: "Price, payment, and value",
    labelSk: "Cena, platobné podmienky a hodnota",
    checks: ["missing price", "unclear VAT", "missing payment deadline", "unclear invoicing conditions"],
  },
  {
    id: "scope_performance",
    severity: "medium",
    label: "Scope and performance",
    labelSk: "Rozsah a plnenie",
    checks: ["vague services", "missing acceptance", "missing service levels", "unclear deliverables"],
  },
  {
    id: "liability_indemnity",
    severity: "high",
    label: "Liability and indemnity",
    labelSk: "Zodpovednosť a odškodnenie",
    checks: ["uncapped liability", "one-sided indemnity", "inconsistent liability cap", "missing exclusions"],
  },
  {
    id: "privacy_security",
    severity: "high",
    label: "Privacy and security",
    labelSk: "Ochrana osobných údajov a bezpečnosť",
    checks: ["personal data without DPA", "missing processor obligations", "missing security controls", "unclear audit rights"],
  },
  {
    id: "public_procurement_crz",
    severity: "high",
    label: "Public procurement and CRZ",
    labelSk: "Verejné obstarávanie a CRZ",
    checks: ["public contract publication dependency", "amendment not linked to base contract", "procurement change risk", "missing official URL"],
  },
  {
    id: "governing_law_disputes",
    severity: "medium",
    label: "Governing law and disputes",
    labelSk: "Rozhodné právo a riešenie sporov",
    checks: ["missing governing law", "missing dispute forum", "conflicting jurisdiction wording", "unclear arbitration/court route"],
  },
];
