import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Clock, FileText, CheckCircle, ArrowRight, Upload, Brain, UserCheck, Lock, Eye, Server, Award, Zap, Star, Quote } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState as useLocalState } from "react";
import { startLogin } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DemoAnimation from "@/components/DemoAnimation";
import SplashIntro from "@/components/SplashIntro";
import { PRICING_PLANS, EXPRESS_ADDON } from "@shared/types";
import { useT } from "@/i18n";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [lightboxImg, setLightboxImg] = useLocalState<string | null>(null);
  const { t, locale, localePath } = useT();

  // Splash intro - show once per session
  const [showSplash, setShowSplash] = useLocalState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("bod_splash_seen");
  });
  const handleSplashComplete = () => {
    sessionStorage.setItem("bod_splash_seen", "1");
    setShowSplash(false);
  };

  // Pricing plan names per locale
  const planNames = locale === "en"
    ? [t.pricing.basicTitle, t.pricing.standardTitle, t.pricing.premiumTitle]
    : PRICING_PLANS.map(p => p.nameSk);
  const planFeatures = locale === "en"
    ? [t.pricing.basicFeatures, t.pricing.standardFeatures, t.pricing.premiumFeatures]
    : PRICING_PLANS.map(p => p.features);
  const planPrices = locale === "en"
    ? [t.pricing.basicPrice, t.pricing.standardPrice, t.pricing.premiumPrice]
    : PRICING_PLANS.map(p => p.priceLabel);

  return (
    <div className="min-h-screen flex flex-col">
      {showSplash && <SplashIntro onComplete={handleSplashComplete} />}
      <Header />

      {/* Hero Section */}
      <section className="bg-hero-bg text-hero-text py-24 md:py-32 relative overflow-hidden">
        {/* Brand watermark background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
          <span className="font-serif text-[12rem] md:text-[18rem] lg:text-[22rem] text-hero-text/[0.03] whitespace-nowrap leading-none">
            bod.legal
          </span>
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-normal mb-6 leading-tight">
              {t.hero.titleLine1}<br />
              <span className="text-hero-text/60">{t.hero.titleLine2}</span>
            </h1>
            <p className="text-lg md:text-xl text-hero-text/70 mb-4 max-w-2xl mx-auto font-sans">
              {t.hero.subtitle}
            </p>
            <p className="text-xs tracking-[0.25em] uppercase text-hero-text/35 mb-8 font-sans font-medium">
              {t.splash.motto}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={localePath("/upload")}>
                <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8">
                  {t.hero.ctaUpload}
                  <Upload className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-sans px-8">
                  {t.hero.ctaPricing}
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-hero-bg/50" />
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-serif font-normal text-foreground">{t.hero.stat1Value}</p>
              <p className="text-xs text-muted-foreground font-sans mt-1 uppercase tracking-wider">{t.hero.stat1Label}</p>
            </div>
            <div>
              <p className="text-3xl font-serif font-normal text-foreground">{t.hero.stat2Value}</p>
              <p className="text-xs text-muted-foreground font-sans mt-1 uppercase tracking-wider">{t.hero.stat2Label}</p>
            </div>
            <div>
              <p className="text-3xl font-serif font-normal text-foreground">{t.hero.stat3Value}</p>
              <p className="text-xs text-muted-foreground font-sans mt-1 uppercase tracking-wider">{t.hero.stat3Label}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Animation */}
      <section className="py-16 md:py-20 bg-warm-bg">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-3">{t.demo.title}</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto font-sans text-sm">
            {t.demo.subtitle}
          </p>
          <DemoAnimation />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">{t.howItWorks.title}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto font-sans">
            {t.howItWorks.subtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { src: "/manus-storage/ako-funguje-1-upload_7a1f5939.png", alt: t.howItWorks.step1Title, title: t.howItWorks.step1Title, desc: t.howItWorks.step1Desc },
              { src: "/manus-storage/ako-funguje-2-analyza_a3e6382a.png", alt: t.howItWorks.step2Title, title: t.howItWorks.step2Title, desc: t.howItWorks.step2Desc },
              { src: "/manus-storage/ako-funguje-3-report_370ea85b.png", alt: t.howItWorks.step3Title, title: t.howItWorks.step3Title, desc: t.howItWorks.step3Desc },
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-sm bg-white overflow-hidden group cursor-pointer" onClick={() => setLightboxImg(item.src)}>
                <CardContent className="p-0">
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="font-sans text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground font-sans text-sm">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why not ChatGPT */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">{t.whyNot.title}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto font-sans">
            {t.whyNot.subtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-6">
              <FileText className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">{t.whyNot.feature1Title}</h4>
              <p className="text-sm text-muted-foreground font-sans">{t.whyNot.feature1Desc}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Shield className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">{t.whyNot.feature2Title}</h4>
              <p className="text-sm text-muted-foreground font-sans">{t.whyNot.feature2Desc}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Lock className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">{t.whyNot.feature3Title}</h4>
              <p className="text-sm text-muted-foreground font-sans">{t.whyNot.feature3Desc}</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">{t.whyNot.feature4Title}</h4>
              <p className="text-sm text-muted-foreground font-sans">{t.whyNot.feature4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-warm-bg">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">{t.comparison.title}</h2>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-4 font-semibold"></th>
                  <th className="py-4 px-4 font-semibold text-primary">{t.comparison.headerBod}</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">{t.comparison.headerTraditional}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">{t.comparison.row1Label}</td>
                  <td className="py-3 px-4 text-primary font-semibold">{t.comparison.row1Bod}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.comparison.row1Trad}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">{t.comparison.row2Label}</td>
                  <td className="py-3 px-4 text-primary font-semibold">{t.comparison.row2Bod}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.comparison.row2Trad}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">{t.comparison.row3Label}</td>
                  <td className="py-3 px-4 text-primary font-semibold">{t.comparison.row3Bod}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.comparison.row3Trad}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">{t.comparison.row4Label}</td>
                  <td className="py-3 px-4 text-primary font-semibold">{t.comparison.row4Bod}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.comparison.row4Trad}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">{t.comparison.row5Label}</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> {t.comparison.row5Bod}</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> {t.comparison.row5Trad}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">{t.comparison.row6Label}</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> {t.comparison.row6Bod}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.comparison.row6Trad}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white" id="pricing">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">{t.pricing.title}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto font-sans">
            {t.pricing.subtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING_PLANS.map((plan, index) => (
              <Card key={plan.id} className={`border shadow-sm hover:shadow-md transition-shadow relative ${index === 1 ? "border-2 border-primary shadow-md" : ""}`}>
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-sans font-semibold px-3 py-1 rounded-full">
                    {t.pricing.standardBadge}
                  </div>
                )}
                <CardContent className="pt-6 pb-6 px-6">
                  <h3 className="font-sans text-xl font-semibold mb-1">{planNames[index]}</h3>
                  <p className="text-3xl font-serif font-normal mb-1">{planPrices[index]}</p>
                  <p className="text-sm text-muted-foreground mb-4 font-sans">{locale === "en" ? t.pricing.basicTime : plan.delivery}</p>
                  <ul className="space-y-2 text-sm font-sans mb-6">
                    {planFeatures[index].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={`${localePath("/upload")}?plan=${plan.id}`}>
                    <Button className="w-full font-sans" variant={index === 1 ? "default" : "outline"}>
                      {t.pricing.ctaSelect}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Express Add-on */}
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="border border-dashed border-primary/30 bg-primary/[0.02]">
              <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-sans font-semibold">{t.pricing.expressTitle}</p>
                    <p className="text-sm text-muted-foreground font-sans">{t.pricing.expressDesc}</p>
                  </div>
                </div>
                <p className="font-serif text-xl">{t.pricing.expressPrice}</p>
              </CardContent>
            </Card>
          </div>

          {/* Guarantee */}
          <div className="max-w-4xl mx-auto mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground font-sans">
              <Clock className="h-4 w-4 inline mr-1" />
              {t.pricing.guarantee}
            </p>
            <Link href={locale === "en" ? "/en/sample-report" : "/vzorovy-report"}>
              <button className="text-sm text-primary hover:underline font-sans inline-flex items-center gap-1 mt-2">
                <Eye className="h-4 w-4" /> {t.pricing.ctaSampleReport}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-warm-bg" id="faq">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">{t.faq.title}</h2>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {t.faq.items.map((item, i) => (
                <AccordionItem key={i} value={`q${i + 1}`} className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="font-sans font-medium text-left">{item.question}</AccordionTrigger>
                  <AccordionContent className="font-sans text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Brand Divider */}
      <div className="bg-white py-4 flex items-center justify-center gap-4 select-none" aria-hidden="true">
        <div className="h-px w-16 bg-border" />
        <span className="font-serif text-sm text-muted-foreground/40 tracking-wider">bod.legal</span>
        <div className="h-px w-16 bg-border" />
      </div>

      {/* Google Reviews */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 font-sans text-lg font-semibold">{t.reviews.rating}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif mb-2">{t.reviews.count}</h2>
            <p className="text-muted-foreground font-sans">{t.reviews.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <Quote className="h-5 w-5 text-primary/30 mb-3" />
                <p className="text-sm font-sans text-foreground mb-4 leading-relaxed">
                  {locale === "en"
                    ? "Very efficient cooperation, prompt responses, professionalism, and creativity in finding solutions."
                    : "Veľmi efektívna spolupráca, promptné reakcie, profesionalita, kreativita pri hľadaní riešení."}
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-muted-foreground font-sans">Dominika H.</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <Quote className="h-5 w-5 text-primary/30 mb-3" />
                <p className="text-sm font-sans text-foreground mb-4 leading-relaxed">
                  {locale === "en"
                    ? "Proactive and professional approach, prompt resolution. You can tell they know their field and have rich experience."
                    : "Proaktívny a profesionálny prístup, promptné riešenie. Je vidno, že sa vo svojej oblasti vyznajú a majú bohaté skúsenosti."}
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-muted-foreground font-sans">Dominik G.</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <Quote className="h-5 w-5 text-primary/30 mb-3" />
                <p className="text-sm font-sans text-foreground mb-4 leading-relaxed">
                  {locale === "en"
                    ? "Working with Robert was in a very pleasant atmosphere, it was human and professional. I recommend."
                    : "Spolupráca s Robertom sa niesla vo veľmi príjemnej atmosfére, bolo to ľudské a profesionálne. Odporúčam."}
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-muted-foreground font-sans">Tamara K. B.</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <a
              href="https://www.google.com/maps/place/KILIAN+LEGAL+s.r.o./"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-sans inline-flex items-center gap-1"
            >
              {t.reviews.viewAll} <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-hero-bg text-hero-text relative overflow-hidden">
        {/* Brand watermark background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
          <span className="font-serif text-[10rem] md:text-[14rem] text-hero-text/[0.03] whitespace-nowrap leading-none">
            bod.legal
          </span>
        </div>
        <div className="container text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">{t.cta.title}</h2>
          <p className="text-hero-text/70 font-sans mb-8 max-w-lg mx-auto">
            {t.cta.subtitle}
          </p>
          <Link href={localePath("/upload")}>
            <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8">
              {t.cta.button}
              <Upload className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />

      {/* Lightbox overlay */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-5xl w-full animate-in fade-in zoom-in-95 duration-200">
            <img
              src={lightboxImg}
              alt={locale === "en" ? "Enlarged detail" : "Zväčšený detail"}
              className="w-full h-auto rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label={t.common.close}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
