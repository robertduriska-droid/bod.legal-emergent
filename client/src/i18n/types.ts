export type Locale = "sk" | "cz" | "en" | "hu";

export interface Translations {
  // Meta
  meta: {
    title: string;
    description: string;
  };
  // Header
  header: {
    howItWorks: string;
    pricing: string;
    faq: string;
    about: string;
    myContracts: string;
    admin: string;
    uploadContract: string;
    signIn: string;
    signInGoogle: string;
  };
  // Splash
  splash: {
    trustBar: string;
    tagline: string;
    motto: string;
  };
  // Hero
  hero: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    ctaUpload: string;
    ctaPricing: string;
    ctaTrial: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
  };
  // Demo section
  demo: {
    title: string;
    subtitle: string;
    uploadLabel: string;
    dragDrop: string;
    fileTypes: string;
    fileName: string;
    fileInfo: string;
    analyzing: string;
    aiScanning: string;
    riskHigh: string;
    riskMedium: string;
    riskLow: string;
    reportReady: string;
    analysisComplete: string;
    highRisk: string;
    mediumRisk: string;
    lowRisk: string;
    generatedDate: string;
    downloadPdf: string;
    tabUpload: string;
    tabAnalysis: string;
    tabReport: string;
    pause: string;
  };
  // How it works
  howItWorks: {
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  // Why not ChatGPT
  whyNot: {
    title: string;
    subtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
  };
  // Comparison table
  comparison: {
    title: string;
    header: string;
    headerBod: string;
    headerTraditional: string;
    row1Label: string;
    row1Bod: string;
    row1Trad: string;
    row2Label: string;
    row2Bod: string;
    row2Trad: string;
    row3Label: string;
    row3Bod: string;
    row3Trad: string;
    row4Label: string;
    row4Bod: string;
    row4Trad: string;
    row5Label: string;
    row5Bod: string;
    row5Trad: string;
    row6Label: string;
    row6Bod: string;
    row6Trad: string;
  };
  // Pricing
  pricing: {
    title: string;
    subtitle: string;
    basicTitle: string;
    basicPrice: string;
    basicTime: string;
    basicFeatures: string[];
    standardTitle: string;
    standardPrice: string;
    standardTime: string;
    standardFeatures: string[];
    standardBadge: string;
    premiumTitle: string;
    premiumPrice: string;
    premiumTime: string;
    premiumFeatures: string[];
    expressTitle: string;
    expressDesc: string;
    expressPrice: string;
    guarantee: string;
    ctaSelect: string;
    ctaSampleReport: string;
  };
  // FAQ
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  // Reviews
  reviews: {
    rating: string;
    count: string;
    subtitle: string;
    viewAll: string;
  };
  // Contract Amnesia (Problem)
  amnesia: {
    title: string;
    subtitle: string;
    definition: string;
    definitionText: string;
    bullets: string[];
  };
  // BOD Loop
  bodLoop: {
    title: string;
    subtitle: string;
    steps: { label: string; desc: string }[];
  };
  // Before/After
  beforeAfter: {
    title: string;
    beforeTitle: string;
    afterTitle: string;
    rows: { label: string; before: string; after: string }[];
  };
  // Sprint
  sprint: {
    title: string;
    subtitle: string;
    duration: string;
    desc: string;
    includes: string[];
    cta: string;
  };
  // New Pricing (Contract Intelligence)
  ciPricing: {
    title: string;
    subtitle: string;
    tiers: { name: string; price: string; desc: string; features: string[]; cta: string; highlighted?: boolean }[];
  };
  // For Whom
  forWhom: {
    title: string;
    qualifyTitle: string;
    qualifyItems: string[];
    disqualifyTitle: string;
    disqualifyItems: string[];
  };
  // Score (Lead Magnet)
  score: {
    title: string;
    subtitle: string;
    cta: string;
    placeholder: string;
    success: string;
  };
  // Security
  security: {
    title: string;
    items: { title: string; desc: string }[];
  };
  // CTA
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  // Footer
  footer: {
    description: string;
    product: string;
    legalInfo: string;
    company: string;
    vop: string;
    privacy: string;
    cookies: string;
    allRights: string;
    legalSources: string;
  };
  // Cookie consent
  cookieConsent: {
    message: string;
    moreInfo: string;
    accept: string;
    reject: string;
  };
  // Common
  common: {
    loading: string;
    error: string;
    back: string;
    close: string;
    download: string;
    comingSoon: string;
  };
  // Upload page
  upload: {
    title: string;
    subtitle: string;
    dragDrop: string;
    dragDropHint: string;
    fileTypes: string;
    changeFile: string;
    selectPlan: string;
    uploadButton: string;
    processing: string;
    uploadFirst: string;
    moreFeatures: string;
    uploadFreePreview: string;
    uploadAndPay: string;
    continueLabel: string;
    basicNote: string;
    paidNote: string;
    testCardNote: string;
    loginNote: string;
    successBasic: string;
    successPaid: string;
    errorUpload: string;
    errorFormat: string;
    errorSize: string;
    errorRead: string;
    loginFirst: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    noContracts: string;
    status: {
      pending: string;
      analyzing: string;
      in_review: string;
      completed: string;
    };
  };
  // Language switcher
  langSwitch: {
    sk: string;
    cz: string;
    en: string;
    hu: string;
  };
}
