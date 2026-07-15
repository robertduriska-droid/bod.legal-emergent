import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin, startGoogleLogin } from "@/const";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
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
              <Button variant="ghost" size="sm" className="font-sans text-[13px] uppercase tracking-wide" onClick={() => startLogin()} data-testid="signin-button">{t.header.signIn}</Button>
              <Button variant="outline" size="sm" className="font-sans text-[13px] gap-2" onClick={() => startGoogleLogin()} data-testid="google-signin-button"><GoogleIcon />{t.header.signInGoogle}</Button>
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
              <Button variant="ghost" className="w-full font-sans" onClick={() => startLogin()} data-testid="signin-button-mobile">{t.header.signIn}</Button>
              <Button variant="outline" className="w-full font-sans mt-2 gap-2" onClick={() => startGoogleLogin()} data-testid="google-signin-button-mobile"><GoogleIcon />{t.header.signInGoogle}</Button>
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
