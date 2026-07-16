import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Shield, Brain, Users, Lock, UserCheck } from "lucide-react";
import { useT } from "@/i18n";
// Created by WP1 (client/src/lib/advokat.ts). Until the config is filled the
// section renders in generic mode; access is guarded below so empty fields
// never produce a fabricated identity.
import { ADVOKAT, SAK_REGISTER_SEARCH_URL, isAdvokatConfigured } from "@/lib/advokat";

// Table row types drive which rows get mailto:/tel:/website link treatment,
// independent of locale-specific label text (e.g. "Telefón" vs "Telefon").
type TableRowType = "text" | "email" | "phone" | "web";

// Advokat identity + security sections (WP4 item 6). Local TX per the
// coordination rules; i18n/* is owned by WP1.
const SECTION_TX = {
  sk: {
    advokatTitle: "Advokát, ktorý podpisuje reporty",
    advokatGeneric:
      "Štandardné a Prémiové reporty overuje a podpisuje advokát zapísaný v Slovenskej advokátskej komore. Prevádzkovateľom služby je advokátska kancelária KILIAN LEGAL s.r.o.",
    advokatFilledLine: (sakId: string) =>
      `Advokát zapísaný v Slovenskej advokátskej komore, reg. č. ${sakId}`,
    advokatVerifyLink: "Overiť v zozname advokátov SAK",
    securityTitle: "Bezpečnosť a dôvernosť",
    securityItems: [
      "Dáta sú uložené na serveroch v Európskej únii.",
      "Dokumenty sú šifrované pri prenose aj pri uložení.",
      "Na advokáta sa vzťahuje povinnosť mlčanlivosti podľa § 23 zákona č. 586/2003 Z. z. o advokácii.",
      "Nahraté dokumenty mažeme do 30 dní od dokončenia kontroly.",
      "Vaše dokumenty nepoužívame na trénovanie AI.",
    ],
  },
  cz: {
    advokatTitle: "Advokát, který podepisuje reporty",
    advokatGeneric:
      "Standardní a Prémiové reporty ověřuje a podepisuje advokát zapsaný ve Slovenské advokátní komoře. Provozovatelem služby je advokátní kancelář KILIAN LEGAL s.r.o.",
    advokatFilledLine: (sakId: string) =>
      `Advokát zapsaný ve Slovenské advokátní komoře, reg. č. ${sakId}`,
    advokatVerifyLink: "Ověřit v seznamu advokátů SAK",
    securityTitle: "Bezpečnost a důvěrnost",
    securityItems: [
      "Data jsou uložena na serverech v Evropské unii.",
      "Dokumenty jsou šifrovány při přenosu i při uložení.",
      "Na advokáta se vztahuje povinnost mlčenlivosti podle § 23 slovenského zákona č. 586/2003 Z. z. o advokacii.",
      "Nahrané dokumenty mažeme do 30 dnů od dokončení kontroly.",
      "Vaše dokumenty nepoužíváme k trénování AI.",
    ],
  },
  en: {
    advokatTitle: "The lawyer who signs the reports",
    advokatGeneric:
      "Standard and Premium reports are verified and signed by a lawyer registered with the Slovak Bar Association. The service is operated by the law firm KILIAN LEGAL s.r.o.",
    advokatFilledLine: (sakId: string) =>
      `Lawyer registered with the Slovak Bar Association, reg. no. ${sakId}`,
    advokatVerifyLink: "Verify in the SAK register of lawyers",
    securityTitle: "Security and confidentiality",
    securityItems: [
      "Data is stored on servers in the European Union.",
      "Documents are encrypted in transit and at rest.",
      "The lawyer is bound by confidentiality under Section 23 of the Slovak Act No. 586/2003 Coll. on Advocacy.",
      "Uploaded documents are deleted within 30 days after the review is completed.",
      "We do not use your documents to train AI.",
    ],
  },
  hu: {
    advokatTitle: "Az ügyvéd, aki aláírja a jelentéseket",
    advokatGeneric:
      "A Standard és Prémium jelentéseket a Szlovák Ügyvédi Kamarában bejegyzett ügyvéd ellenőrzi és írja alá. A szolgáltatást a KILIAN LEGAL s.r.o. ügyvédi iroda üzemelteti.",
    advokatFilledLine: (sakId: string) =>
      `A Szlovák Ügyvédi Kamarában bejegyzett ügyvéd, nyilvántartási szám: ${sakId}`,
    advokatVerifyLink: "Ellenőrzés a SAK ügyvédi névjegyzékében",
    securityTitle: "Biztonság és titoktartás",
    securityItems: [
      "Az adatokat az Európai Unióban található szervereken tároljuk.",
      "A dokumentumok átvitel és tárolás közben is titkosítva vannak.",
      "Az ügyvédet titoktartási kötelezettség terheli a szlovák ügyvédi törvény (586/2003. sz. törvény) 23. §-a szerint.",
      "A feltöltött dokumentumokat az ellenőrzés befejezése után 30 napon belül töröljük.",
      "Dokumentumait nem használjuk AI tanítására.",
    ],
  },
};

export default function About() {
  const { locale } = useT();

  const contentByLocale = {
    en: {
      title: "About us",
      intro: "bod.legal is a product of the law firm KILIAN LEGAL s.r.o. We combine legal expertise with AI technology for commercial contract review.",
      whatWeDoTitle: "What we do",
      whatWeDoText: "We review commercial contracts for companies and entrepreneurs. AI analyzes every clause, identifies risks, and adds references to specific paragraphs of Slovak and European legal regulations. With Standard and Premium plans, a lawyer verifies findings and signs the report.",
      features: [
        { icon: Scale, title: "Lawyer verification", desc: "Reports for Standard and Premium plans are verified by a lawyer registered with the Slovak Bar Association." },
        { icon: Brain, title: "AI analysis", desc: "Language models analyze the contract clause by clause with references to Slov-Lex and EUR-Lex." },
        { icon: Shield, title: "Security", desc: "Encrypted storage, GDPR compliance, and attorney-client privilege." },
        { icon: Users, title: "For businesses", desc: "We focus on commercial contracts: supply, framework, license, SPA, and similar." },
      ],
      companyTitle: "KILIAN LEGAL s.r.o.",
      tableRows: [
        { label: "Company name", value: "KILIAN LEGAL s.r.o.", type: "text" as TableRowType },
        { label: "Company ID", value: "53 957 008", type: "text" as TableRowType },
        { label: "Registered office", value: "Hrudky 1401/46A, Chorvátsky Grob 900 25", type: "text" as TableRowType },
        { label: "Date of registration", value: "20.07.2021", type: "text" as TableRowType },
        { label: "Legal form", value: "Limited liability company", type: "text" as TableRowType },
        { label: "Director", value: "Michal Kilian", type: "text" as TableRowType },
        { label: "Share capital", value: "€5,000 (paid up: €5,000)", type: "text" as TableRowType },
        { label: "Email", value: "robert.duriska@bod.legal", type: "email" as TableRowType },
        { label: "Phone", value: "+421 917 333 692", type: "phone" as TableRowType },
        { label: "Website", value: "bod.legal", type: "web" as TableRowType },
      ],
      sourcesTitle: "Legal sources",
      sourcesIntro: "AI analysis references official legal sources:",
      sources: [
        { url: "https://www.slov-lex.sk", name: "Slov-Lex", desc: "Legal and information portal of the Ministry of Justice of the Slovak Republic" },
        { url: "https://eur-lex.europa.eu", name: "EUR-Lex", desc: "European Union law" },
        { url: "https://www.crz.gov.sk", name: "CRZ", desc: "Central Register of Contracts" },
      ],
    },
    sk: {
      title: "O nás",
      intro: "bod.legal je produkt advokátskej kancelárie KILIAN LEGAL s.r.o. Kombinujeme právnu expertízu s AI technológiou na kontrolu obchodných zmlúv.",
      whatWeDoTitle: "Čo robíme",
      whatWeDoText: "Kontrolujeme obchodné zmluvy pre firmy a podnikateľov. AI analyzuje každú klauzulu, identifikuje riziká a doplní odkazy na konkrétne paragrafy slovenských a európskych právnych predpisov. Pri Štandardnej a Prémiovej kontrole advokát overí nálezy a podpíše report.",
      features: [
        { icon: Scale, title: "Overenie advokátom", desc: "Report pri Štandardnej a Prémiovej kontrole overuje advokát zapísaný v Slovenskej advokátskej komore." },
        { icon: Brain, title: "AI analýza", desc: "Jazykové modely analyzujú zmluvu klauzulu po klauzule s odkazmi na Slov-Lex a EUR-Lex." },
        { icon: Shield, title: "Bezpečnosť", desc: "Šifrované úložisko, GDPR súlad a advokátska mlčanlivosť." },
        { icon: Users, title: "Pre firmy", desc: "Zameriavame sa na obchodné zmluvy: dodávateľské, rámcové, licenčné, SPA a podobne." },
      ],
      companyTitle: "KILIAN LEGAL s.r.o.",
      tableRows: [
        { label: "Obchodné meno", value: "KILIAN LEGAL s.r.o.", type: "text" as TableRowType },
        { label: "IČO", value: "53 957 008", type: "text" as TableRowType },
        { label: "Sídlo", value: "Hrudky 1401/46A, Chorvátsky Grob 900 25", type: "text" as TableRowType },
        { label: "Deň zápisu", value: "20.07.2021", type: "text" as TableRowType },
        { label: "Právna forma", value: "Spoločnosť s ručením obmedzeným", type: "text" as TableRowType },
        { label: "Konateľ", value: "Michal Kilian", type: "text" as TableRowType },
        { label: "Základné imanie", value: "5 000 eur (splatené: 5 000 eur)", type: "text" as TableRowType },
        { label: "E-mail", value: "robert.duriska@bod.legal", type: "email" as TableRowType },
        { label: "Telefón", value: "+421 917 333 692", type: "phone" as TableRowType },
        { label: "Web", value: "bod.legal", type: "web" as TableRowType },
      ],
      sourcesTitle: "Právne zdroje",
      sourcesIntro: "AI analýza odkazuje na oficiálne právne zdroje:",
      sources: [
        { url: "https://www.slov-lex.sk", name: "Slov-Lex", desc: "Právny a informačný portál Ministerstva spravodlivosti SR" },
        { url: "https://eur-lex.europa.eu", name: "EUR-Lex", desc: "Právo Európskej únie" },
        { url: "https://www.crz.gov.sk", name: "CRZ", desc: "Centrálny register zmlúv" },
      ],
    },
    cz: {
      title: "O nás",
      intro: "bod.legal je produkt advokátní kanceláře KILIAN LEGAL s.r.o. Kombinujeme právní expertízu s AI technologií pro kontrolu obchodních smluv.",
      whatWeDoTitle: "Co děláme",
      whatWeDoText: "Kontrolujeme obchodní smlouvy pro firmy a podnikatele. AI analyzuje každou klauzuli, identifikuje rizika a doplní odkazy na konkrétní paragrafy českých a evropských právních předpisů. U Standardní a Prémiové kontroly advokát ověří nálezy a podepíše report.",
      features: [
        { icon: Scale, title: "Ověření advokátem", desc: "Report u Standardní a Prémiové kontroly ověřuje advokát zapsaný ve Slovenské advokátní komoře." },
        { icon: Brain, title: "AI analýza", desc: "Jazykové modely analyzují smlouvu klauzuli po klauzuli s odkazy na zakonyprolidi.cz a EUR-Lex." },
        { icon: Shield, title: "Bezpečnost", desc: "Šifrované úložiště, soulad s GDPR a advokátní mlčenlivost." },
        { icon: Users, title: "Pro firmy", desc: "Zaměřujeme se na obchodní smlouvy: dodavatelské, rámcové, licenční, SPA a podobné." },
      ],
      companyTitle: "KILIAN LEGAL s.r.o.",
      tableRows: [
        { label: "Obchodní jméno", value: "KILIAN LEGAL s.r.o.", type: "text" as TableRowType },
        { label: "IČO", value: "53 957 008", type: "text" as TableRowType },
        { label: "Sídlo", value: "Hrudky 1401/46A, Chorvátsky Grob 900 25, Slovenská republika", type: "text" as TableRowType },
        { label: "Den zápisu", value: "20.07.2021", type: "text" as TableRowType },
        { label: "Právní forma", value: "Společnost s ručením omezeným", type: "text" as TableRowType },
        { label: "Jednatel", value: "Michal Kilian", type: "text" as TableRowType },
        { label: "Základní kapitál", value: "5 000 EUR (splaceno: 5 000 EUR)", type: "text" as TableRowType },
        { label: "E-mail", value: "robert.duriska@bod.legal", type: "email" as TableRowType },
        { label: "Telefon", value: "+421 917 333 692", type: "phone" as TableRowType },
        { label: "Web", value: "bod.legal", type: "web" as TableRowType },
      ],
      sourcesTitle: "Právní zdroje",
      sourcesIntro: "AI analýza odkazuje na oficiální právní zdroje:",
      sources: [
        { url: "https://www.zakonyprolidi.cz", name: "Zákony pro lidi", desc: "Právní a informační portál (Občanský zákoník, Zákon o obchodních korporacích)" },
        { url: "https://eur-lex.europa.eu", name: "EUR-Lex", desc: "Právo Evropské unie" },
        { url: "https://smlouvy.gov.cz", name: "Registr smluv", desc: "Registr smluv České republiky" },
      ],
    },
    hu: {
      title: "Rólunk",
      intro: "A bod.legal a KILIAN LEGAL s.r.o. ügyvédi iroda terméke. A jogi szakértelmet AI-technológiával ötvözzük az üzleti szerződések ellenőrzéséhez.",
      whatWeDoTitle: "Mit csinálunk",
      whatWeDoText: "Üzleti szerződéseket ellenőrzünk cégek és vállalkozók számára. Az AI minden klauzulát elemez, azonosítja a kockázatokat, és hivatkozásokat ad a szlovák és cseh, valamint az európai jogszabályok konkrét szakaszaira. A Standard és Prémium csomagoknál ügyvéd ellenőrzi a megállapításokat, és aláírja a jelentést.",
      features: [
        { icon: Scale, title: "Ügyvédi ellenőrzés", desc: "A Standard és Prémium csomagok jelentéseit a Szlovák Ügyvédi Kamarában bejegyzett ügyvéd ellenőrzi." },
        { icon: Brain, title: "AI-elemzés", desc: "A nyelvi modellek klauzuláról klauzulára elemzik a szerződést, Slov-Lex és EUR-Lex hivatkozásokkal." },
        { icon: Shield, title: "Biztonság", desc: "Titkosított tárolás, GDPR-megfelelőség és ügyvédi titoktartás." },
        { icon: Users, title: "Cégeknek", desc: "Üzleti szerződésekre összpontosítunk: szállítási, keret-, licenc-, SPA- és hasonló szerződések." },
      ],
      companyTitle: "KILIAN LEGAL s.r.o.",
      tableRows: [
        { label: "Cégnév", value: "KILIAN LEGAL s.r.o.", type: "text" as TableRowType },
        { label: "Cégjegyzékszám", value: "53 957 008", type: "text" as TableRowType },
        { label: "Székhely", value: "Hrudky 1401/46A, Chorvátsky Grob 900 25, Szlovákia", type: "text" as TableRowType },
        { label: "Bejegyzés dátuma", value: "2021.07.20.", type: "text" as TableRowType },
        { label: "Jogi forma", value: "Korlátolt felelősségű társaság", type: "text" as TableRowType },
        { label: "Ügyvezető", value: "Michal Kilian", type: "text" as TableRowType },
        { label: "Jegyzett tőke", value: "5 000 EUR (befizetve: 5 000 EUR)", type: "text" as TableRowType },
        { label: "E-mail", value: "robert.duriska@bod.legal", type: "email" as TableRowType },
        { label: "Telefon", value: "+421 917 333 692", type: "phone" as TableRowType },
        { label: "Weboldal", value: "bod.legal", type: "web" as TableRowType },
      ],
      sourcesTitle: "Jogforrások",
      sourcesIntro: "Az AI-elemzés hivatalos szlovák, cseh és uniós jogforrásokra hivatkozik:",
      sources: [
        { url: "https://www.slov-lex.sk", name: "Slov-Lex", desc: "A Szlovák Köztársaság Igazságügyi Minisztériumának jogi portálja" },
        { url: "https://www.zakonyprolidi.cz", name: "Zákony pro lidi", desc: "Cseh jogszabályok portálja" },
        { url: "https://eur-lex.europa.eu", name: "EUR-Lex", desc: "Az Európai Unió joga" },
      ],
    },
  };

  const content = contentByLocale[locale];
  const sections = SECTION_TX[locale] ?? SECTION_TX.sk;

  // Defensive view over the WP1 config: never render a name or number that
  // is not explicitly filled in. Placeholder-empty config = generic mode.
  const adv: { name?: string; sakId?: string; photoUrl?: string; sakRegisterUrl?: string } =
    ADVOKAT ?? {};
  const advokatFilled = isAdvokatConfigured();
  const sakRegisterUrl = adv?.sakRegisterUrl || SAK_REGISTER_SEARCH_URL;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-6">{content.title}</h1>
          
          <div className="prose prose-sm font-sans max-w-none">
            <p className="text-lg text-muted-foreground mb-8">{content.intro}</p>

            <h2 className="text-2xl font-serif mt-12 mb-4">{content.whatWeDoTitle}</h2>
            <p className="text-muted-foreground mb-8">{content.whatWeDoText}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              {content.features.map((f, i) => (
                <div key={i} className="flex gap-4">
                  <f.icon className="h-8 w-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-sans font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* The human behind the signature (WP4 item 6) */}
            <h2 className="text-2xl font-serif mt-12 mb-4">{sections.advokatTitle}</h2>
            <div className="bg-muted/30 rounded-lg p-6 border flex items-start gap-4">
              {advokatFilled && adv.photoUrl ? (
                <img
                  src={adv.photoUrl}
                  alt={adv.name}
                  className="h-20 w-20 rounded-full object-cover border shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <UserCheck className="h-8 w-8 text-primary shrink-0 mt-1" aria-hidden="true" />
              )}
              <div>
                {advokatFilled ? (
                  <>
                    <p className="font-sans font-semibold mb-1">{adv.name}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {sections.advokatFilledLine(adv.sakId as string)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mb-2">{sections.advokatGeneric}</p>
                )}
                <a
                  href={sakRegisterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {sections.advokatVerifyLink}
                </a>
              </div>
            </div>

            {/* Security and confidentiality (WP4 item 6). Facts only, no
                certification claims. */}
            <h2 className="text-2xl font-serif mt-12 mb-4">{sections.securityTitle}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {sections.securityItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-2xl font-serif mt-12 mb-4">{content.companyTitle}</h2>
            <div className="bg-muted/30 rounded-lg p-6 border">
              <table className="text-sm font-sans w-full">
                <tbody>
                  {content.tableRows.map((row, i) => (
                    <tr key={i} className={i < content.tableRows.length - 1 ? "border-b" : ""}>
                      <td className="py-2 font-medium w-40">{row.label}</td>
                      <td className="py-2 text-muted-foreground">
                        {row.type === "email" ? (
                          <a href={`mailto:${row.value}`} className="text-primary hover:underline">{row.value}</a>
                        ) : row.type === "phone" ? (
                          <a href="tel:+421917333692" className="text-primary hover:underline">{row.value}</a>
                        ) : row.type === "web" ? (
                          <a href="https://bod.legal" className="text-primary hover:underline">{row.value}</a>
                        ) : (
                          row.value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-serif mt-12 mb-4">{content.sourcesTitle}</h2>
            <p className="text-muted-foreground mb-4">{content.sourcesIntro}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {content.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{s.name}</a> - {s.desc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
