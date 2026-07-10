import { useState, useEffect, useCallback } from "react";
import { useT } from "@/i18n";

/**
 * SplashIntro - Full-screen intro animation with large bod.legal logo.
 * Shows on first visit per session, then fades out to reveal the page.
 * Uses sessionStorage so it only plays once per browser session.
 *
 * Timeline:
 *   0ms      → "enter" phase starts (logo fades in from scale 0.95)
 *   800ms    → "hold" phase (logo fully visible, tagline appears)
 *   2200ms   → "exit" phase (entire overlay fades out + slides up)
 *   2900ms   → "done" (overlay removed from DOM)
 */
export default function SplashIntro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit" | "done">("enter");
  const { t } = useT();

  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("hold"), 800);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase === "hold") {
      const holdTimer = setTimeout(() => setPhase("exit"), 1400);
      return () => clearTimeout(holdTimer);
    }
    if (phase === "exit") {
      const exitTimer = setTimeout(() => {
        setPhase("done");
        stableOnComplete();
      }, 700);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, stableOnComplete]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-auto ${
        phase === "exit"
          ? "opacity-0 -translate-y-6"
          : "opacity-100 translate-y-0"
      }`}
      style={{
        backgroundColor: "#141414",
        transition: phase === "exit"
          ? "opacity 700ms cubic-bezier(0.23, 1, 0.32, 1), transform 700ms cubic-bezier(0.23, 1, 0.32, 1)"
          : "none",
      }}
    >
      {/* Top trust bar */}
      <div
        className="absolute top-8 left-0 right-0 text-center"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 600ms cubic-bezier(0.23, 1, 0.32, 1), transform 600ms cubic-bezier(0.23, 1, 0.32, 1)",
          transitionDelay: "100ms",
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
          transition: "opacity 700ms cubic-bezier(0.23, 1, 0.32, 1), transform 700ms cubic-bezier(0.23, 1, 0.32, 1)",
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
          transition: "opacity 500ms cubic-bezier(0.23, 1, 0.32, 1), transform 500ms cubic-bezier(0.23, 1, 0.32, 1)",
          transitionDelay: phase === "hold" ? "200ms" : "0ms",
        }}
      >
        <p
          className="text-base md:text-lg font-sans tracking-wide"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {t.splash.tagline}
        </p>
      </div>
    </div>
  );
}
