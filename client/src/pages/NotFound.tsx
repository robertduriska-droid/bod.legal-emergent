import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-6xl font-serif mb-4">404</p>
          <h1 className="text-xl font-sans font-semibold mb-2">Stránka nenájdená</h1>
          <p className="text-muted-foreground font-sans mb-8">
            Táto stránka neexistuje alebo bola presunutá.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="font-sans">
                <Home className="w-4 h-4 mr-2" />
                Na úvodnú stránku
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="outline" className="font-sans">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Nahrať zmluvu
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
