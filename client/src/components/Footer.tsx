import { Link } from "wouter";
import { useT } from "@/i18n";

export default function Footer() {
  const { t, locale, localePath } = useT();

  // VOP/GDPR use different slugs in English (terms/privacy); cookies keeps the same slug everywhere.
  const vopPath = locale === "en" ? "/en/terms" : locale === "cz" ? "/cz/vop" : "/vop";
  const privacyPath = locale === "en" ? "/en/privacy" : locale === "cz" ? "/cz/gdpr" : "/gdpr";
  const cookiesPath = localePath("/cookies");

  return (
    <footer className="bg-hero-bg text-hero-text/70 py-12 relative overflow-hidden">
      {/* Brand watermark background */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none select-none" aria-hidden="true">
        <span className="font-serif text-[8rem] md:text-[12rem] text-hero-text/[0.03] whitespace-nowrap leading-none translate-y-8">
          bod.legal
        </span>
      </div>
      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <p className="font-serif text-xl text-hero-text mb-2">bod.legal</p>
            <p className="text-sm font-sans">{t.footer.description}</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-sans font-medium text-hero-text mb-3 text-[13px] uppercase tracking-[0.05em]">{t.footer.product}</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><a href={`${localePath("/")}#how-it-works`} className="hover:text-hero-text transition-colors">{t.header.howItWorks}</a></li>
              <li><a href={`${localePath("/")}#pricing`} className="hover:text-hero-text transition-colors">{t.header.pricing}</a></li>
              <li><a href={`${localePath("/")}#faq`} className="hover:text-hero-text transition-colors">{t.header.faq}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans font-medium text-hero-text mb-3 text-[13px] uppercase tracking-[0.05em]">{t.footer.legalInfo}</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><Link href={vopPath} className="hover:text-hero-text transition-colors">{t.footer.vop}</Link></li>
              <li><Link href={privacyPath} className="hover:text-hero-text transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href={cookiesPath} className="hover:text-hero-text transition-colors">{t.footer.cookies}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-sans font-medium text-hero-text mb-3 text-[13px] uppercase tracking-[0.05em]">{t.footer.company}</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><Link href={localePath("/about")} className="hover:text-hero-text transition-colors">{t.header.about}</Link></li>
              <li>KILIAN LEGAL s.r.o.</li>
              <li>IČO: 53 957 008</li>
              <li><a href="mailto:robert.duriska@bod.legal" className="hover:text-hero-text transition-colors">robert.duriska@bod.legal</a></li>
              <li><a href="tel:+421917333692" className="hover:text-hero-text transition-colors">+421 917 333 692</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hero-text/10 mt-8 pt-8 text-center text-xs font-sans">
          <p>&copy; {new Date().getFullYear()} KILIAN LEGAL s.r.o. {t.footer.allRights}</p>
          <p className="mt-1">
            {t.footer.legalSources}{" "}
            {locale === "cz" ? (
              <>
                <a href="https://www.zakonyprolidi.cz" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">Zákony pro lidi</a>
                {" | "}
                <a href="https://eur-lex.europa.eu" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">EUR-Lex</a>
                {" | "}
                <a href="https://smlouvy.gov.cz" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">Registr smluv</a>
              </>
            ) : (
              <>
                <a href="https://www.slov-lex.sk" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">Slov-Lex</a>
                {" | "}
                <a href="https://eur-lex.europa.eu" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">EUR-Lex</a>
                {" | "}
                <a href="https://www.crz.gov.sk" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">CRZ</a>
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
