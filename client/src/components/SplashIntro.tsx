import { useState, useEffect, useCallback } from "react";
import { useT } from "@/i18n";

/**
 * SplashIntro - Full-screen intro animation with large bod.legal logo.
 * Shows on first visit per session, then fades out to reveal the page.
 * Uses sessionStorage (in Home.tsx) so it only plays once per browser session.
 *
 * Timeline (~1.5s total):
 *   0ms      → "enter" phase (logo fades in from scale 0.95)
 *   400ms    → "hold" phase (logo fully visible, tagline appears)
 *   1000ms   → "exit" phase (entire overlay fades out + slides up)
 *   1500ms   → "done" (overlay removed from DOM)
 *
 * Skipped entirely (finishes immediately) when:
 *   - the visitor prefers reduced motion, or
 *   - the URL contains ad-campaign parameters (utm_).
 * A click anywhere on the overlay, or the "Preskočiť" button, jumps to exit.
 */

const SKIP_TX: Record<string, string> = {
  sk: "Preskočiť",
  cz: "Přeskočit",
  en: "Skip",
  hu: "Kihagyás",
};

function shouldSkipEntirely(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.search.includes("utm_")) return true;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return false;
}

export default function SplashIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit" | "done">(() =>
    shouldSkipEntirely() ? "done" : "enter"
  );
  const { t, locale } = useT();

  const stableOnComplete = useCallback(onComplete, []);

  // When skipped entirely, notify the parent right away so the page content
  // is visible immediately and the session flag still gets set.
  useEffect(() => {
    if (phase === "done") {
      stableOnComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "enter") return;
    const enterTimer = setTimeout(() => setPhase("hold"), 400);
    return () => clearTimeout(enterTimer);
  }, [phase]);

  useEffect(() => {
    if (phase === "hold") {
      const holdTimer = setTimeout(() => setPhase("exit"), 600);
      return () => clearTimeout(holdTimer);
    }
    if (phase === "exit") {
      const exitTimer = setTimeout(() => {
        setPhase("done");
        stableOnComplete();
      }, 500);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, stableOnComplete]);

  const skipToExit = useCallback(() => {
    setPhase((p) => (p === "enter" || p === "hold" ? "exit" : p));
  }, []);

  if (phase === "done") return null;

  return (
    <div
      onClick={skipToExit}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-auto cursor-pointer ${
        phase === "exit"
          ? "opacity-0 -translate-y-6"
          : "opacity-100 translate-y-0"
      }`}
      style={{
        backgroundColor: "#141414",
        transition: phase === "exit"
          ? "opacity 500ms cubic-bezier(0.23, 1, 0.32, 1), transform 500ms cubic-bezier(0.23, 1, 0.32, 1)"
          : "none",
      }}
    >
      {/* Top trust bar */}
      <div
        className="absolute top-8 left-0 right-0 text-center"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 400ms cubic-bezier(0.23, 1, 0.32, 1), transform 400ms cubic-bezier(0.23, 1, 0.32, 1)",
          transitionDelay: "50ms",
        }}
      >
        <p
          className="text-xs tracking-[0.25em] uppercase font-sans"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {t.splash.trustBar}
        </p>
      </div>

      {/* Main logo */}
      <div
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.95)" : "scale(1)",
          transition: "opacity 400ms cubic-bezier(0.23, 1, 0.32, 1), transform 400ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <h1
          className="font-serif font-normal text-white leading-none select-none"
          style={{ fontSize: "clamp(4rem, 12vw, 10rem)" }}
        >
          bod.legal
        </h1>
      </div>

      {/* Tagline */}
      <div
        className="mt-4"
        style={{
          opacity: phase === "hold" || phase === "exit" ? 1 : 0,
          transform: phase === "enter" ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
          transitionDelay: phase === "hold" ? "50ms" : "0ms",
        }}
      >
        <p
          className="text-base md:text-lg font-sans tracking-wide"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {t.splash.tagline}
        </p>
      </div>

      {/* Motto */}
      <div
        className="mt-6"
        style={{
          opacity: phase === "hold" || phase === "exit" ? 1 : 0,
          transform: phase === "enter" ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
          transitionDelay: phase === "hold" ? "100ms" : "0ms",
        }}
      >
        <p
          className="text-sm md:text-base font-sans tracking-[0.2em] uppercase font-medium"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          {t.splash.motto}
        </p>
      </div>

      {/* Visible skip button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skipToExit();
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-sans text-xs tracking-widest uppercase px-4 py-2 rounded-full border transition-colors"
        style={{
          color: "rgba(255,255,255,0.55)",
          borderColor: "rgba(255,255,255,0.25)",
          backgroundColor: "transparent",
        }}
      >
        {SKIP_TX[locale] ?? SKIP_TX.sk}
      </button>
    </div>
  );
}
