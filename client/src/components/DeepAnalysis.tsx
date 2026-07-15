import { AlertOctagon, ClipboardList, ShieldCheck, Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/i18n";

type Finding = { title: string; detail: string };

export type DeepAnalysisData = {
  riskScore: number;
  dealBreakers: Finding[];
  missingProvisions: Finding[];
  verificationNotes: string | null;
  redacted: boolean;
};

interface TxShape {
  title: string;
  subtitle: string;
  scoreLabel: string;
  dealBreakers: string;
  noDealBreakers: string;
  missing: string;
  noMissing: string;
  verification: string;
  scoreWords: string[];
}

const TX: Record<Locale, TxShape> = {
  sk: {
    title: "Hĺbková analýza (Mike OS)",
    subtitle: "Rozšírená kontrola: kritické riziká, chýbajúce ustanovenia a overenie nálezov.",
    scoreLabel: "Celkové rizikové skóre",
    dealBreakers: "Kritické riziká (deal-breakers)",
    noDealBreakers: "Nenašli sme žiadne kritické prekážky podpisu.",
    missing: "Chýbajúce ustanovenia",
    noMissing: "Nezistili sme žiadne dôležité chýbajúce ustanovenia.",
    verification: "Overenie nálezov",
    scoreWords: ["", "Nízke", "Skôr nízke", "Stredné", "Vysoké", "Kritické"],
  },
  cz: {
    title: "Hloubková analýza (Mike OS)",
    subtitle: "Rozšířená kontrola: kritická rizika, chybějící ustanovení a ověření nálezů.",
    scoreLabel: "Celkové rizikové skóre",
    dealBreakers: "Kritická rizika (deal-breakers)",
    noDealBreakers: "Nenašli jsme žádné kritické překážky podpisu.",
    missing: "Chybějící ustanovení",
    noMissing: "Nezjistili jsme žádná důležitá chybějící ustanovení.",
    verification: "Ověření nálezů",
    scoreWords: ["", "Nízké", "Spíše nízké", "Střední", "Vysoké", "Kritické"],
  },
  en: {
    title: "Deep analysis (Mike OS)",
    subtitle: "Extended review: deal-breakers, missing provisions, and a verification pass.",
    scoreLabel: "Overall risk score",
    dealBreakers: "Deal-breakers",
    noDealBreakers: "No critical blockers to signing were found.",
    missing: "Missing provisions",
    noMissing: "No important missing provisions were detected.",
    verification: "Findings verification",
    scoreWords: ["", "Low", "Fairly low", "Medium", "High", "Critical"],
  },
  hu: {
    title: "Mélyelemzés (Mike OS)",
    subtitle: "Kiterjesztett ellenőrzés: kritikus kockázatok, hiányzó rendelkezések és ellenőrző fázis.",
    scoreLabel: "Összesített kockázati pontszám",
    dealBreakers: "Kritikus kockázatok (deal-breakers)",
    noDealBreakers: "Nem találtunk az aláírást megakadályozó kritikus tényezőt.",
    missing: "Hiányzó rendelkezések",
    noMissing: "Nem észleltünk fontos hiányzó rendelkezést.",
    verification: "Megállapítások ellenőrzése",
    scoreWords: ["", "Alacsony", "Inkább alacsony", "Közepes", "Magas", "Kritikus"],
  },
};

export default function DeepAnalysis({ data, locale }: { data: DeepAnalysisData; locale: Locale }) {
  const tx = TX[locale];
  const score = Math.min(5, Math.max(1, data.riskScore || 3));
  const scoreColor = score >= 4 ? "text-red-600" : score === 3 ? "text-amber-600" : "text-green-600";
  const barColor = score >= 4 ? "bg-red-500" : score === 3 ? "bg-amber-500" : "bg-green-500";

  return (
    <Card className="mb-8" data-testid="deep-analysis">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl">{tx.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground font-sans mb-5">{tx.subtitle}</p>

        {/* Overall risk score */}
        <div className="mb-6" data-testid="deep-analysis-risk-score">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-sans font-medium">{tx.scoreLabel}</span>
            <span className={`font-serif text-2xl ${scoreColor}`}>
              {score}
              <span className="text-sm text-muted-foreground font-sans"> / 5 · {tx.scoreWords[score]}</span>
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= score ? barColor : "bg-muted"}`} />
            ))}
          </div>
        </div>

        {!data.redacted && (
          <>
            {/* Deal-breakers */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className="h-4 w-4 text-red-600" />
                <h3 className="font-sans font-semibold text-sm">{tx.dealBreakers}</h3>
              </div>
              {data.dealBreakers.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">{tx.noDealBreakers}</p>
              ) : (
                <ul className="space-y-2">
                  {data.dealBreakers.map((f, i) => (
                    <li key={i} className="border-l-2 border-red-300 bg-red-50 rounded-r p-3" data-testid={`deal-breaker-${i}`}>
                      <p className="text-sm font-sans font-medium text-red-800">{f.title}</p>
                      <p className="text-sm font-sans text-muted-foreground">{f.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Missing provisions */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-amber-600" />
                <h3 className="font-sans font-semibold text-sm">{tx.missing}</h3>
              </div>
              {data.missingProvisions.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">{tx.noMissing}</p>
              ) : (
                <ul className="space-y-2">
                  {data.missingProvisions.map((f, i) => (
                    <li key={i} className="border-l-2 border-amber-300 bg-amber-50 rounded-r p-3" data-testid={`missing-provision-${i}`}>
                      <p className="text-sm font-sans font-medium text-amber-800">{f.title}</p>
                      <p className="text-sm font-sans text-muted-foreground">{f.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Verification pass */}
            {data.verificationNotes && (
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-sans font-semibold text-sm">{tx.verification}</h3>
                </div>
                <p className="text-sm font-sans text-muted-foreground leading-relaxed">{data.verificationNotes}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
