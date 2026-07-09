import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useState } from "react";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold tracking-tight">bod.legal</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 font-sans text-[13px] uppercase tracking-wide">
          <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Ako to funguje</a>
          <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Cenník</a>
          <a href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">O nás</Link>
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="font-sans text-[13px] uppercase tracking-wide">Moje zmluvy</Button>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="font-sans text-[13px] uppercase tracking-wide">Admin</Button>
                </Link>
              )}
              <Link href="/upload">
                <Button size="sm" className="font-sans text-[13px] uppercase tracking-wide">Nahrať zmluvu</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="font-sans text-[13px] uppercase tracking-wide" onClick={() => startLogin()}>Prihlásiť sa</Button>
              <Link href="/upload">
                <Button size="sm" className="font-sans text-[13px] uppercase tracking-wide">Nahrať zmluvu</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white py-4 px-4 space-y-3 font-sans">
          <a href="/#how-it-works" className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>Ako to funguje</a>
          <a href="/#pricing" className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>Cenník</a>
          <a href="/#faq" className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>FAQ</a>
          <Link href="/about" className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>O nás</Link>
          <hr />
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="block" onClick={() => setMobileOpen(false)}>Moje zmluvy</Link>
              {isAdmin && <Link href="/admin" className="block" onClick={() => setMobileOpen(false)}>Admin panel</Link>}
              <Link href="/upload" onClick={() => setMobileOpen(false)}>
                <Button className="w-full font-sans mt-2">Nahrať zmluvu</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" className="w-full font-sans" onClick={() => startLogin()}>Prihlásiť sa</Button>
              <Link href="/upload" onClick={() => setMobileOpen(false)}>
                <Button className="w-full font-sans mt-2">Nahrať zmluvu</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
