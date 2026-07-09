import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-hero-bg text-hero-text/70 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <p className="font-serif text-xl text-hero-text mb-2">bod.legal</p>
            <p className="text-sm font-sans">
              Kontrola zmlúv s AI a overením advokátom. Prevádzkované KILIAN LEGAL s.r.o.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-sans font-medium text-hero-text mb-3 text-[13px] uppercase tracking-[0.05em]">Produkt</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><a href="/#how-it-works" className="hover:text-hero-text transition-colors">Ako to funguje</a></li>
              <li><a href="/#pricing" className="hover:text-hero-text transition-colors">Cenník</a></li>
              <li><a href="/#faq" className="hover:text-hero-text transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans font-medium text-hero-text mb-3 text-[13px] uppercase tracking-[0.05em]">Právne informácie</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><Link href="/vop" className="hover:text-hero-text transition-colors">VOP</Link></li>
              <li><Link href="/gdpr" className="hover:text-hero-text transition-colors">Ochrana osobných údajov</Link></li>
              <li><Link href="/cookies" className="hover:text-hero-text transition-colors">Cookies</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-sans font-medium text-hero-text mb-3 text-[13px] uppercase tracking-[0.05em]">Spoločnosť</h4>
            <ul className="space-y-2 text-sm font-sans">
              <li><Link href="/about" className="hover:text-hero-text transition-colors">O nás</Link></li>
              <li>KILIAN LEGAL s.r.o.</li>
              <li>IČO: 53 957 008</li>
              <li><a href="mailto:robert.duriska@bod.legal" className="hover:text-hero-text transition-colors">robert.duriska@bod.legal</a></li>
              <li><a href="tel:+421917333692" className="hover:text-hero-text transition-colors">+421 917 333 692</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hero-text/10 mt-8 pt-8 text-center text-xs font-sans">
          <p>&copy; {new Date().getFullYear()} KILIAN LEGAL s.r.o. Všetky práva vyhradené.</p>
          <p className="mt-1">
            Právne zdroje:{" "}
            <a href="https://www.slov-lex.sk" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">Slov-Lex</a>
            {" | "}
            <a href="https://eur-lex.europa.eu" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">EUR-Lex</a>
            {" | "}
            <a href="https://www.crz.gov.sk" target="_blank" rel="noopener noreferrer" className="underline hover:text-hero-text">CRZ</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
