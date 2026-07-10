import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Shield, Brain, Users } from "lucide-react";
import { useT } from "@/i18n";

export default function About() {
  const { locale } = useT();

  const content = locale === "en" ? {
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
    tableLabels: ["Company name", "Company ID", "Registered office", "Date of registration", "Legal form", "Director", "Share capital", "Email", "Phone", "Website"],
    tableValues: ["KILIAN LEGAL s.r.o.", "53 957 008", "Hrudky 1401/46A, Chorvátsky Grob 900 25", "20.07.2021", "Limited liability company", "Michal Kilian", "€5,000 (paid up: €5,000)", "robert.duriska@bod.legal", "+421 917 333 692", "bod.legal"],
    sourcesTitle: "Legal sources",
    sourcesIntro: "AI analysis references official legal sources:",
    sources: [
      { url: "https://www.slov-lex.sk", name: "Slov-Lex", desc: "Legal and information portal of the Ministry of Justice of the Slovak Republic" },
      { url: "https://eur-lex.europa.eu", name: "EUR-Lex", desc: "European Union law" },
      { url: "https://www.crz.gov.sk", name: "CRZ", desc: "Central Register of Contracts" },
    ],
  } : {
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
    tableLabels: ["Obchodné meno", "IČO", "Sídlo", "Deň zápisu", "Právna forma", "Konateľ", "Základné imanie", "E-mail", "Telefón", "Web"],
    tableValues: ["KILIAN LEGAL s.r.o.", "53 957 008", "Hrudky 1401/46A, Chorvátsky Grob 900 25", "20.07.2021", "Spoločnosť s ručením obmedzeným", "Michal Kilian", "5 000 eur (splatené: 5 000 eur)", "robert.duriska@bod.legal", "+421 917 333 692", "bod.legal"],
    sourcesTitle: "Právne zdroje",
    sourcesIntro: "AI analýza odkazuje na oficiálne právne zdroje:",
    sources: [
      { url: "https://www.slov-lex.sk", name: "Slov-Lex", desc: "Právny a informačný portál Ministerstva spravodlivosti SR" },
      { url: "https://eur-lex.europa.eu", name: "EUR-Lex", desc: "Právo Európskej únie" },
      { url: "https://www.crz.gov.sk", name: "CRZ", desc: "Centrálny register zmlúv" },
    ],
  };

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
                  {content.tableLabels.map((label, i) => (
                    <tr key={i} className={i < content.tableLabels.length - 1 ? "border-b" : ""}>
                      <td className="py-2 font-medium w-40">{label}</td>
                      <td className="py-2 text-muted-foreground">
                        {label.includes("mail") || label.includes("E-mail") ? (
                          <a href={`mailto:${content.tableValues[i]}`} className="text-primary hover:underline">{content.tableValues[i]}</a>
                        ) : label.includes("elefón") || label.includes("Phone") ? (
                          <a href={`tel:+421917333692`} className="text-primary hover:underline">{content.tableValues[i]}</a>
                        ) : label.includes("Web") || label.includes("Website") ? (
                          <a href="https://bod.legal" className="text-primary hover:underline">{content.tableValues[i]}</a>
                        ) : (
                          content.tableValues[i]
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
