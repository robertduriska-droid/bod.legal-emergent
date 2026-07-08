// ─── Contract Types ─────────────────────────────────────────────────────────

export type ContractPlan = "basic" | "standard" | "premium" | "audit";
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
  legalBasis?: string; // e.g. "§ 536 Obchodného zákonníka"
  legalSourceUrl?: string; // Slov-Lex or EUR-Lex URL
  riskCategory?: string; // from risk taxonomy
}

export interface AnalysisResult {
  contractType: ContractType;
  clauses: ClauseAnalysis[];
  summary: string;
  recommendation: string;
  riskSummary: { high: number; medium: number; low: number };
  applicableLegalSources: LegalSource[];
}

// ─── Pricing Plan Details ───────────────────────────────────────────────────

export interface PricingPlan {
  id: ContractPlan;
  name: string;
  nameSk: string;
  price: string;
  delivery: string;
  maxPages: number | null;
  features: string[];
  includesLawyer: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic Review",
    nameSk: "Základná kontrola",
    price: "€149",
    delivery: "24h",
    maxPages: 20,
    features: ["AI analýza rizík", "Kontrola klauzula po klauzule", "Report rizík", "Do 20 strán"],
    includesLawyer: false,
  },
  {
    id: "standard",
    name: "Standard Review",
    nameSk: "Štandardná kontrola",
    price: "€349",
    delivery: "48h",
    maxPages: 50,
    features: ["Všetko zo Základnej", "Kontrola advokátom", "Návrhy úprav", "Do 50 strán", "Prioritná podpora"],
    includesLawyer: true,
  },
  {
    id: "premium",
    name: "Premium Review",
    nameSk: "Prémiová kontrola",
    price: "€749",
    delivery: "72h",
    maxPages: 100,
    features: ["Všetko zo Štandardnej", "Plná právna analýza", "30min konzultácia", "Do 100 strán", "Redline dokument", "Dedikovaný advokát"],
    includesLawyer: true,
  },
  {
    id: "audit",
    name: "Legal Audit",
    nameSk: "Legal Audit",
    price: "Na mieru",
    delivery: "Individuálne",
    maxPages: null,
    features: ["Všetky zmluvy skontrolované", "Riziková matica a dashboard", "Compliance kontrola", "Priradený tím advokátov", "60min strategický call", "Priebežná podpora"],
    includesLawyer: true,
  },
];

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
