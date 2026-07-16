import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useSearch } from "wouter";
import { CheckCircle, Sparkles, ShieldCheck, CreditCard, Clock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT, type Locale } from "@/i18n";

interface TxShape {
  badge: string;
  title: string;
  subtitle: string;
  b1: string; b2: string; b3: string; b4: string;
  startCta: string;
  noCharge: string;
  testCardNote: string;
  afterTrialTitle: string;
  afterTrialText: string;
  activeTitle: string;
  daysLeft: (n: number) => string;
  analysisAvailable: string;
  analysisUsed: string;
  uploadCta: string;
  loginFirst: string;
  startError: string;
  setupSuccess: string;
  setupCancelled: string;
}

const TX: Record<Locale, TxShape> = {
  sk: {
    badge: "15 dní zadarmo",
    title: "Vyskúšajte bod.legal zadarmo",
    subtitle: "15-dňová skúšobná verzia s 1 bezplatnou analýzou zmluvy. Kartu overíme, no počas skúšky vám nič nestrhneme.",
    b1: "15 dní plného prístupu",
    b2: "1 kompletná analýza zmluvy zadarmo (vrátane právnych odkazov)",
    b3: "Bez záväzku, kedykoľvek zrušíte",
    b4: "Karta sa iba overí, počas skúšky bez platby",
    startCta: "Spustiť skúšobnú verziu",
    noCharge: "Počas skúšobnej doby vám nič nestrhneme.",
    testCardNote: "Testovací režim: karta 4242 4242 4242 4242, ľubovoľný budúci dátum a CVC.",
    afterTrialTitle: "Čo sa stane po 15 dňoch?",
    afterTrialText: "Po 15 dňoch sa nič neúčtuje. Kartu iba overíme, žiadne predplatné nevzniká. Ak si objednáte kontrolu, zaplatíte len jej pevnú cenu.",
    activeTitle: "Skúšobná verzia je aktívna",
    daysLeft: (n) => n === 1 ? "Zostáva 1 deň" : n >= 2 && n <= 4 ? `Zostávajú ${n} dni` : `Zostáva ${n} dní`,
    analysisAvailable: "1 bezplatná analýza k dispozícii",
    analysisUsed: "Bezplatná analýza už bola využitá",
    uploadCta: "Nahrať zmluvu",
    loginFirst: "Najprv sa prosím prihláste.",
    startError: "Nepodarilo sa spustiť skúšobnú verziu: ",
    setupSuccess: "Skúšobná verzia bola aktivovaná!",
    setupCancelled: "Nastavenie karty bolo zrušené.",
  },
  cz: {
    badge: "15 dní zdarma",
    title: "Vyzkoušejte bod.legal zdarma",
    subtitle: "15denní zkušební verze s 1 bezplatnou analýzou smlouvy. Kartu ověříme, ale během zkoušky vám nic nestrhneme.",
    b1: "15 dní plného přístupu",
    b2: "1 kompletní analýza smlouvy zdarma (včetně právních odkazů)",
    b3: "Bez závazku, kdykoli zrušíte",
    b4: "Karta se pouze ověří, během zkoušky bez platby",
    startCta: "Spustit zkušební verzi",
    noCharge: "Během zkušební doby vám nic nestrhneme.",
    testCardNote: "Testovací režim: karta 4242 4242 4242 4242, libovolné budoucí datum a CVC.",
    afterTrialTitle: "Co se stane po 15 dnech?",
    afterTrialText: "Po 15 dnech se nic neúčtuje. Kartu pouze ověříme, žádné předplatné nevzniká. Pokud si objednáte kontrolu, zaplatíte jen její pevnou cenu.",
    activeTitle: "Zkušební verze je aktivní",
    daysLeft: (n) => n === 1 ? "Zbývá 1 den" : n >= 2 && n <= 4 ? `Zbývají ${n} dny` : `Zbývá ${n} dnů`,
    analysisAvailable: "1 bezplatná analýza k dispozici",
    analysisUsed: "Bezplatná analýza již byla využita",
    uploadCta: "Nahrát smlouvu",
    loginFirst: "Nejprve se prosím přihlaste.",
    startError: "Nepodařilo se spustit zkušební verzi: ",
    setupSuccess: "Zkušební verze byla aktivována!",
    setupCancelled: "Nastavení karty bylo zrušeno.",
  },
  en: {
    badge: "15 days free",
    title: "Try bod.legal for free",
    subtitle: "A 15-day trial with 1 free contract analysis. We verify your card, but you won't be charged during the trial.",
    b1: "15 days of full access",
    b2: "1 complete contract analysis free (with legal references)",
    b3: "No commitment, cancel anytime",
    b4: "Card is only verified, no charge during the trial",
    startCta: "Start free trial",
    noCharge: "You won't be charged during the trial period.",
    testCardNote: "Test mode: card 4242 4242 4242 4242, any future date and CVC.",
    afterTrialTitle: "What happens after 15 days?",
    afterTrialText: "Nothing is charged after 15 days. We only verify your card, no subscription is created. If you order a review, you pay only its fixed price.",
    activeTitle: "Your trial is active",
    daysLeft: (n) => n === 1 ? "1 day left" : `${n} days left`,
    analysisAvailable: "1 free analysis available",
    analysisUsed: "Free analysis already used",
    uploadCta: "Upload contract",
    loginFirst: "Please sign in first.",
    startError: "Could not start the trial: ",
    setupSuccess: "Your trial has been activated!",
    setupCancelled: "Card setup was cancelled.",
  },
  hu: {
    badge: "15 nap ingyen",
    title: "Próbálja ki a bod.legalt ingyen",
    subtitle: "15 napos próbaidőszak 1 ingyenes szerződéselemzéssel. A kártyát ellenőrizzük, de a próba alatt nem terheljük meg.",
    b1: "15 nap teljes hozzáférés",
    b2: "1 teljes szerződéselemzés ingyen (jogszabályi hivatkozásokkal)",
    b3: "Kötelezettség nélkül, bármikor lemondható",
    b4: "A kártyát csak ellenőrizzük, a próba alatt nincs terhelés",
    startCta: "Ingyenes próba indítása",
    noCharge: "A próbaidőszak alatt nem terheljük meg a kártyáját.",
    testCardNote: "Tesztmód: 4242 4242 4242 4242 kártya, bármely jövőbeli dátum és CVC.",
    afterTrialTitle: "Mi történik 15 nap után?",
    afterTrialText: "15 nap után semmit nem számlázunk. A kártyát csak ellenőrizzük, előfizetés nem jön létre. Ha ellenőrzést rendel, csak annak fix árát fizeti.",
    activeTitle: "A próbaidőszak aktív",
    daysLeft: (n) => `${n} nap van hátra`,
    analysisAvailable: "1 ingyenes elemzés elérhető",
    analysisUsed: "Az ingyenes elemzést már felhasználta",
    uploadCta: "Szerződés feltöltése",
    loginFirst: "Kérjük, először jelentkezzen be.",
    startError: "A próba indítása nem sikerült: ",
    setupSuccess: "A próbaidőszak aktiválva lett!",
    setupCancelled: "A kártya beállítása megszakadt.",
  },
};

export default function Trial() {
  const { isAuthenticated, loading } = useAuth();
  const { locale, localePath } = useT();
  const tx = TX[locale];
  const search = useSearch();
  const setupResult = new URLSearchParams(search).get("setup");

  const statusQuery = trpc.trial.status.useQuery(undefined, { enabled: isAuthenticated });
  const startMutation = trpc.trial.start.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (e) => toast.error(tx.startError + e.message),
  });

  useEffect(() => {
    if (setupResult === "success") {
      toast.success(tx.setupSuccess);
      statusQuery.refetch();
    } else if (setupResult === "cancelled") {
      toast.info(tx.setupCancelled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupResult]);

  const handleStart = () => {
    if (!isAuthenticated) {
      toast.info(tx.loginFirst);
      startLogin();
      return;
    }
    startMutation.mutate({ redirectPath: localePath("/trial") });
  };

  const s = statusQuery.data;
  const benefits = [tx.b1, tx.b2, tx.b3, tx.b4];

  return (
    <div className="min-h-screen flex flex-col" data-testid="trial-page">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-sans font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" /> {tx.badge}
            </div>
            <h1 className="text-4xl font-serif mb-3">{tx.title}</h1>
            <p className="text-muted-foreground font-sans">{tx.subtitle}</p>
          </div>

          {isAuthenticated && s?.active ? (
            <Card className="mb-8 border-primary/30" data-testid="trial-active-card">
              <CardContent className="p-6 text-center">
                <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                <h2 className="font-serif text-2xl mb-1">{tx.activeTitle}</h2>
                <p className="text-sm text-muted-foreground font-sans mb-5">
                  {tx.daysLeft(s.daysLeft)} · {s.freeAnalysisAvailable ? tx.analysisAvailable : tx.analysisUsed}
                </p>
                <Link href={localePath("/upload")}>
                  <Button size="lg" className="font-sans" data-testid="trial-upload-button">
                    {tx.uploadCta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8" data-testid="trial-start-card">
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm font-sans">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="w-full font-sans"
                  onClick={handleStart}
                  disabled={startMutation.isPending || loading}
                  data-testid="trial-start-button"
                >
                  {startMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  {tx.startCta}
                </Button>
                <p className="text-xs text-muted-foreground font-sans mt-3 flex items-center gap-1 justify-center">
                  <Clock className="h-3 w-3" /> {tx.noCharge}
                </p>
                {import.meta.env.VITE_STRIPE_TEST_MODE === "true" && (
                  <p className="text-xs text-amber-600 font-sans mt-2 text-center">{tx.testCardNote}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* What happens after the 15 days: plainly visible answer */}
          <div className="rounded-lg border bg-muted/30 p-5" data-testid="trial-after-info">
            <h2 className="font-sans text-sm font-semibold mb-1">{tx.afterTrialTitle}</h2>
            <p className="text-sm text-muted-foreground font-sans">{tx.afterTrialText}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
