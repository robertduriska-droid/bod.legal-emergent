import { useEffect, useState, useCallback } from "react";
import { useT } from "@/i18n";

/**
 * Animated demo showing the bod.legal workflow:
 * 1. Upload contract → 2. AI analysis → 3. Report ready
 * With play/pause and step navigation controls.
 */
export default function DemoAnimation() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { locale } = useT();

  const texts = locale === "en" ? {
    stepLabels: ["Upload", "Analysis", "Report"],
    dragDrop: "Drag & drop file here",
    fileTypes: "PDF, DOCX - max 50 MB",
    filePages: "12 pages - 2.4 MB",
    analyzing: "Analyzing clauses...",
    analyzingDesc: "AI reviews the contract clause by clause",
    high: "High",
    medium: "Medium",
    risk1: "§ 4.2 Exclusion of liability for indirect damages",
    risk2: "§ 11.2 IP rights transfer without compensation",
    risk3: "§ 7.1 Delaware jurisdiction - unfavorable for SVK",
    reportReady: "Report is ready",
    reportDone: "Analysis completed in 18 minutes",
    highRisk: "High risk",
    mediumRisk: "Medium risk",
    lowRisk: "Low risk",
    reportFile: "Analysis_Framework_agreement_IT.pdf",
    generated: "Generated July 10, 2025",
    downloadPdf: "Download PDF",
    play: "Play",
    pause: "Pause",
    paused: "Paused",
  } : {
    stepLabels: ["Nahratie", "Analýza", "Report"],
    dragDrop: "Pretiahnite súbor sem",
    fileTypes: "PDF, DOCX - max 50 MB",
    filePages: "12 strán - 2.4 MB",
    analyzing: "Analyzujem klauzuly...",
    analyzingDesc: "AI prehľadáva zmluvu klauzulu po klauzule",
    high: "Vysoké",
    medium: "Stredné",
    risk1: "§ 4.2 Vylúčenie zodpovednosti za nepriame škody",
    risk2: "§ 11.2 Prevod IP práv bez kompenzácie",
    risk3: "§ 7.1 Jurisdikcia Delaware - nevýhodná pre SR",
    reportReady: "Report je hotový",
    reportDone: "Analýza dokončená za 18 minút",
    highRisk: "Vysoké riziko",
    mediumRisk: "Stredné riziko",
    lowRisk: "Nízke riziko",
    reportFile: "Analýza_Ramcova_zmluva_IT.pdf",
    generated: "Vygenerované 10. júla 2025",
    downloadPdf: "Stiahnuť PDF",
    play: "Spustiť",
    pause: "Pozastaviť",
    paused: "Pauza",
  };

  const stepLabels = texts.stepLabels;

  useEffect(() => {
    if (isPaused) return;

    const sequence = [
      { duration: 2500, next: 1 },
      { duration: 3000, next: 2 },
      { duration: 3000, next: 0 },
    ];

    const timer = setTimeout(() => {
      setStep(sequence[step].next);
      setProgress(0);
    }, sequence[step].duration);

    let progressInterval: ReturnType<typeof setInterval> | null = null;
    if (step === 1) {
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 2, 100));
      }, 50);
    }

    return () => {
      clearTimeout(timer);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [step, isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const goToStep = useCallback((targetStep: number) => {
    setStep(targetStep);
    setProgress(0);
    setIsPaused(true);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-white rounded-2xl shadow-xl border overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border rounded-md px-4 py-1 text-xs text-muted-foreground font-mono">
              bod.legal/upload
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 md:p-10 flex items-center justify-center" style={{ minHeight: "320px" }}>
          {/* Step 0: Upload */}
          <div
            className="absolute inset-0 top-[41px] flex items-center justify-center p-8 transition-all duration-500"
            style={{
              opacity: step === 0 ? 1 : 0,
              transform: step === 0 ? "scale(1)" : "scale(0.95)",
              pointerEvents: step === 0 ? "auto" : "none",
            }}
          >
            <div className="w-full max-w-md">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-all duration-300 hover:border-primary/50">
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-semibold text-sm mb-1">{texts.dragDrop}</p>
                <p className="text-xs text-muted-foreground">{texts.fileTypes}</p>
              </div>
              <div
                className="mt-4 flex items-center gap-3 bg-gray-50 rounded-lg p-3 border transition-all duration-700"
                style={{
                  opacity: step === 0 ? 1 : 0,
                  transform: step === 0 ? "translateY(0)" : "translateY(-20px)",
                  transitionDelay: "0.8s",
                }}
              >
                <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Ramcova_zmluva_IT.pdf</p>
                  <p className="text-xs text-muted-foreground">{texts.filePages}</p>
                </div>
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Step 1: Analyzing */}
          <div
            className="absolute inset-0 top-[41px] flex items-center justify-center p-8 transition-all duration-500"
            style={{
              opacity: step === 1 ? 1 : 0,
              transform: step === 1 ? "scale(1)" : "scale(0.95)",
              pointerEvents: step === 1 ? "auto" : "none",
            }}
          >
            <div className="w-full max-w-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#1a1a1a"
                      strokeWidth="3"
                      strokeDasharray={`${progress}, 100`}
                      className="transition-all duration-100"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {progress}%
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{texts.analyzing}</p>
                  <p className="text-sm text-muted-foreground">{texts.analyzingDesc}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div
                  className="flex items-center gap-3 bg-red-50 rounded-lg p-3 border border-red-100 transition-all duration-500"
                  style={{
                    opacity: progress > 30 ? 1 : 0,
                    transform: progress > 30 ? "translateX(0)" : "translateX(-10px)",
                  }}
                >
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">{texts.high}</span>
                  <span className="text-sm">{texts.risk1}</span>
                </div>
                <div
                  className="flex items-center gap-3 bg-red-50 rounded-lg p-3 border border-red-100 transition-all duration-500"
                  style={{
                    opacity: progress > 55 ? 1 : 0,
                    transform: progress > 55 ? "translateX(0)" : "translateX(-10px)",
                  }}
                >
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">{texts.high}</span>
                  <span className="text-sm">{texts.risk2}</span>
                </div>
                <div
                  className="flex items-center gap-3 bg-orange-50 rounded-lg p-3 border border-orange-100 transition-all duration-500"
                  style={{
                    opacity: progress > 75 ? 1 : 0,
                    transform: progress > 75 ? "translateX(0)" : "translateX(-10px)",
                  }}
                >
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">{texts.medium}</span>
                  <span className="text-sm">{texts.risk3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Report ready */}
          <div
            className="absolute inset-0 top-[41px] flex items-center justify-center p-8 transition-all duration-500"
            style={{
              opacity: step === 2 ? 1 : 0,
              transform: step === 2 ? "scale(1)" : "scale(0.95)",
              pointerEvents: step === 2 ? "auto" : "none",
            }}
          >
            <div className="w-full max-w-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">{texts.reportReady}</p>
                  <p className="text-sm text-muted-foreground">{texts.reportDone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                  <p className="text-2xl font-bold text-red-600">2</p>
                  <p className="text-xs text-red-600/80">{texts.highRisk}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
                  <p className="text-2xl font-bold text-orange-600">2</p>
                  <p className="text-xs text-orange-600/80">{texts.mediumRisk}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-600">1</p>
                  <p className="text-xs text-green-600/80">{texts.lowRisk}</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border">
                <div>
                  <p className="text-sm font-medium">{texts.reportFile}</p>
                  <p className="text-xs text-muted-foreground">{texts.generated}</p>
                </div>
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                  {texts.downloadPdf}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-50/90 backdrop-blur-sm border-t px-4 py-2.5 flex items-center justify-between">
          {/* Play/Pause button */}
          <button
            onClick={togglePause}
            className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label={isPaused ? texts.play : texts.pause}
          >
            {isPaused ? (
              <svg className="w-3.5 h-3.5 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            )}
          </button>

          {/* Step navigation */}
          <div className="flex items-center gap-1">
            {stepLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  step === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-gray-200 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Paused indicator */}
          <div className="w-8 flex justify-end">
            {isPaused && (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                {texts.paused}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
