import { Button } from "@/components/ui/button";
import { Home, Upload } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/i18n";

const TX = {
  sk: {
    title: "Stránka nenájdená",
    desc: "Táto stránka neexistuje.",
    upload: "Nahrať zmluvu zadarmo",
    home: "Domov",
  },
  en: {
    title: "Page not found",
    desc: "This page does not exist.",
    upload: "Upload a contract for free",
    home: "Home",
  },
  cz: {
    title: "Stránka nenalezena",
    desc: "Tato stránka neexistuje.",
    upload: "Nahrát smlouvu zdarma",
    home: "Domů",
  },
  hu: {
    title: "Az oldal nem található",
    desc: "Ez az oldal nem létezik.",
    upload: "Szerződés feltöltése ingyen",
    home: "Főoldal",
  },
};

export default function NotFound() {
  const { locale, localePath } = useT();
  const tx = TX[locale] ?? TX.sk;
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-6xl font-serif mb-4">404</p>
          <h1 className="text-xl font-sans font-semibold mb-2">{tx.title}</h1>
          <p className="text-muted-foreground font-sans mb-8">{tx.desc}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={localePath("/upload")}>
              <Button className="font-sans">
                <Upload className="w-4 h-4 mr-2" />
                {tx.upload}
              </Button>
            </Link>
            <Link href={localePath("/")}>
              <Button variant="outline" className="font-sans">
                <Home className="w-4 h-4 mr-2" />
                {tx.home}
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
