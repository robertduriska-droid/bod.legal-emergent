import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";
import { useT } from "@/i18n";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, localePath } = useT();

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={localePath("/")} className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold tracking-tight">bod.legal</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 font-sans text-[13px] uppercase tracking-wide">
          <a href={`${localePath("/")}#how-it-works`} className="text-muted-foreground hover:text-foreground transition-colors">{t.header.howItWorks}</a>
          <a href={`${localePath("/")}#pricing`} className="text-muted-foreground hover:text-foreground transition-colors">{t.header.pricing}</a>
          <a href={`${localePath("/")}#faq`} className="text-muted-foreground hover:text-foreground transition-colors">{t.header.faq}</a>
          <Link href={localePath("/about")} className="text-muted-foreground hover:text-foreground transition-colors">{t.header.about}</Link>
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link href={localePath("/dashboard")}>
                <Button variant="ghost" size="sm" className="font-sans text-[13px] uppercase tracking-wide">{t.header.myContracts}</Button>
              </Link>
              {isAdmin && (
                <Link href={localePath("/admin")}>
                  <Button variant="ghost" size="sm" className="font-sans text-[13px] uppercase tracking-wide">{t.header.admin}</Button>
                </Link>
              )}
              <Link href={localePath("/upload")}>
                <Button size="sm" className="font-sans text-[13px] uppercase tracking-wide">{t.header.uploadContract}</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="font-sans text-[13px] uppercase tracking-wide" onClick={() => startLogin()}>{t.header.signIn}</Button>
              <Link href={localePath("/upload")}>
                <Button size="sm" className="font-sans text-[13px] uppercase tracking-wide">{t.header.uploadContract}</Button>
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
          <a href={`${localePath("/")}#how-it-works`} className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.header.howItWorks}</a>
          <a href={`${localePath("/")}#pricing`} className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.header.pricing}</a>
          <a href={`${localePath("/")}#faq`} className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.header.faq}</a>
          <Link href={localePath("/about")} className="block text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.header.about}</Link>
          <hr />
          <div className="py-2"><LanguageSwitcher /></div>
          {isAuthenticated ? (
            <>
              <Link href={localePath("/dashboard")} className="block" onClick={() => setMobileOpen(false)}>{t.header.myContracts}</Link>
              {isAdmin && <Link href={localePath("/admin")} className="block" onClick={() => setMobileOpen(false)}>{t.header.admin}</Link>}
              <Link href={localePath("/upload")} onClick={() => setMobileOpen(false)}>
                <Button className="w-full font-sans mt-2">{t.header.uploadContract}</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" className="w-full font-sans" onClick={() => startLogin()}>{t.header.signIn}</Button>
              <Link href={localePath("/upload")} onClick={() => setMobileOpen(false)}>
                <Button className="w-full font-sans mt-2">{t.header.uploadContract}</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
