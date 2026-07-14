import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Shield, Brain, Users } from "lucide-react";
import { useT } from "@/i18n";

// Table row types drive which rows get mailto:/tel:/website link treatment,
// independent of locale-specific label text (e.g. "Telefón" vs "Telefon").
type TableRowType = "text" | "email" | "phone" | "web";

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
        { icon: Scale, title: "Ověření advokátem", desc: "Report u Standardní a Prémiové kontroly ověřuje advokát zapsaný v České advokátní komoře (ČAK)." },
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
  };

  const content = contentByLocale[locale];

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
