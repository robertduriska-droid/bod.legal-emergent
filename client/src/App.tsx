import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { Component, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import CookieConsent from "./components/CookieConsent";
import FloatingContact from "./components/FloatingContact";
import I18nProvider from "./i18n/I18nProvider";
import { useT } from "./i18n";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Upload = lazy(() => import("./pages/Upload"));
const ContractDetail = lazy(() => import("./pages/ContractDetail"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminReview = lazy(() => import("./pages/AdminReview"));
const Report = lazy(() => import("./pages/Report"));
const About = lazy(() => import("./pages/About"));
const VOP = lazy(() => import("./pages/VOP"));
const GDPR = lazy(() => import("./pages/GDPR"));
const Cookies = lazy(() => import("./pages/Cookies"));
const FreeSken = lazy(() => import("./pages/FreeSken"));
const SampleReport = lazy(() => import("./pages/SampleReport"));
const Trial = lazy(() => import("./pages/Trial"));

function PageLoader() {
  const { t } = useT();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse font-sans text-muted-foreground">{t.common.loading}</div>
    </div>
  );
}

// ─── Per-route error boundary (WP4 item 8) ──────────────────────────────────
// One crashing page must not blank the whole app: every route element gets
// its own boundary with a recoverable fallback. The shared ErrorBoundary
// component stays untouched (full-page, reload-only) as the outermost net.

const ROUTE_FALLBACK_TX = {
  sk: {
    title: "Niečo sa pokazilo",
    desc: "Túto stránku sa nepodarilo zobraziť. Ostatné časti aplikácie fungujú ďalej.",
    retry: "Skúsiť znova",
  },
  cz: {
    title: "Něco se pokazilo",
    desc: "Tuto stránku se nepodařilo zobrazit. Ostatní části aplikace fungují dál.",
    retry: "Zkusit znovu",
  },
  en: {
    title: "Something went wrong",
    desc: "This page could not be displayed. The rest of the app keeps working.",
    retry: "Try again",
  },
  hu: {
    title: "Hiba történt",
    desc: "Ezt az oldalt nem sikerült megjeleníteni. Az alkalmazás többi része tovább működik.",
    retry: "Próbálja újra",
  },
};

function RouteFallback({ onRetry }: { onRetry: () => void }) {
  const { locale } = useT();
  const tx = ROUTE_FALLBACK_TX[locale] ?? ROUTE_FALLBACK_TX.sk;
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="text-center max-w-md mx-auto">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-serif mb-2">{tx.title}</h1>
        <p className="text-sm text-muted-foreground font-sans mb-6">{tx.desc}</p>
        <Button className="font-sans" onClick={onRetry}>
          <RotateCcw className="w-4 h-4 mr-2" />
          {tx.retry}
        </Button>
      </div>
    </div>
  );
}

class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[RouteErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return <RouteFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// Wrapped once at module level so route components keep a stable identity
// across renders (no remount churn). Props (incl. wouter route params) pass
// straight through to the page.
function withRouteBoundary(Page: ComponentType<any>) {
  return function BoundedPage(props: any) {
    return (
      <RouteErrorBoundary>
        <Page {...props} />
      </RouteErrorBoundary>
    );
  };
}

const HomePage = withRouteBoundary(Home);
const DashboardPage = withRouteBoundary(Dashboard);
const UploadPage = withRouteBoundary(Upload);
const ContractDetailPage = withRouteBoundary(ContractDetail);
const AdminPanelPage = withRouteBoundary(AdminPanel);
const AdminReviewPage = withRouteBoundary(AdminReview);
const ReportPage = withRouteBoundary(Report);
const AboutPage = withRouteBoundary(About);
const VOPPage = withRouteBoundary(VOP);
const GDPRPage = withRouteBoundary(GDPR);
const CookiesPage = withRouteBoundary(Cookies);
// /preview/:id and /report/:id must stay reachable without any auth-forcing
// wrapper: WP1's anonymous free-scan funnel lands here and auth (if any) is
// handled inside the pages themselves.
const FreeSkenPage = withRouteBoundary(FreeSken);
const SampleReportPage = withRouteBoundary(SampleReport);
const TrialPage = withRouteBoundary(Trial);
const NotFoundPage = withRouteBoundary(NotFound);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Slovak routes (default, no prefix) */}
        <Route path="/" component={HomePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/upload" component={UploadPage} />
        <Route path="/contract/:id" component={ContractDetailPage} />
        <Route path="/report/:id" component={ReportPage} />
        <Route path="/admin" component={AdminPanelPage} />
        <Route path="/admin/review/:id" component={AdminReviewPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/vop" component={VOPPage} />
        <Route path="/gdpr" component={GDPRPage} />
        <Route path="/cookies" component={CookiesPage} />
        <Route path="/preview/:id" component={FreeSkenPage} />
        <Route path="/vzorovy-report" component={SampleReportPage} />
        <Route path="/trial" component={TrialPage} />
        <Route path="/cz/trial" component={TrialPage} />
        <Route path="/en/trial" component={TrialPage} />
        <Route path="/hu/trial" component={TrialPage} />

        {/* Czech routes (/cz prefix) */}
        <Route path="/cz" component={HomePage} />
        <Route path="/cz/dashboard" component={DashboardPage} />
        <Route path="/cz/upload" component={UploadPage} />
        <Route path="/cz/contract/:id" component={ContractDetailPage} />
        <Route path="/cz/report/:id" component={ReportPage} />
        <Route path="/cz/admin" component={AdminPanelPage} />
        <Route path="/cz/admin/review/:id" component={AdminReviewPage} />
        <Route path="/cz/about" component={AboutPage} />
        <Route path="/cz/vop" component={VOPPage} />
        <Route path="/cz/gdpr" component={GDPRPage} />
        <Route path="/cz/cookies" component={CookiesPage} />
        <Route path="/cz/preview/:id" component={FreeSkenPage} />
        <Route path="/cz/vzorovy-report" component={SampleReportPage} />

        {/* English routes (/en prefix) */}
        <Route path="/en" component={HomePage} />
        <Route path="/en/dashboard" component={DashboardPage} />
        <Route path="/en/upload" component={UploadPage} />
        <Route path="/en/contract/:id" component={ContractDetailPage} />
        <Route path="/en/report/:id" component={ReportPage} />
        <Route path="/en/admin" component={AdminPanelPage} />
        <Route path="/en/admin/review/:id" component={AdminReviewPage} />
        <Route path="/en/about" component={AboutPage} />
        <Route path="/en/terms" component={VOPPage} />
        <Route path="/en/privacy" component={GDPRPage} />
        <Route path="/en/cookies" component={CookiesPage} />
        <Route path="/en/preview/:id" component={FreeSkenPage} />
        <Route path="/en/sample-report" component={SampleReportPage} />

        {/* Hungarian routes (/hu prefix) */}
        <Route path="/hu" component={HomePage} />
        <Route path="/hu/dashboard" component={DashboardPage} />
        <Route path="/hu/upload" component={UploadPage} />
        <Route path="/hu/contract/:id" component={ContractDetailPage} />
        <Route path="/hu/report/:id" component={ReportPage} />
        <Route path="/hu/admin" component={AdminPanelPage} />
        <Route path="/hu/admin/review/:id" component={AdminReviewPage} />
        <Route path="/hu/about" component={AboutPage} />
        <Route path="/hu/vop" component={VOPPage} />
        <Route path="/hu/gdpr" component={GDPRPage} />
        <Route path="/hu/cookies" component={CookiesPage} />
        <Route path="/hu/preview/:id" component={FreeSkenPage} />
        <Route path="/hu/sample-report" component={SampleReportPage} />

        <Route path="/404" component={NotFoundPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <I18nProvider>
            <Toaster />
            <Router />
            <CookieConsent />
            <FloatingContact />
          </I18nProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
