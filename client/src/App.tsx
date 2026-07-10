import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
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

function PageLoader() {
  const { t } = useT();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse font-sans text-muted-foreground">{t.common.loading}</div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Slovak routes (default, no prefix) */}
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/upload" component={Upload} />
        <Route path="/contract/:id" component={ContractDetail} />
        <Route path="/report/:id" component={Report} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/admin/review/:id" component={AdminReview} />
        <Route path="/about" component={About} />
        <Route path="/vop" component={VOP} />
        <Route path="/gdpr" component={GDPR} />
        <Route path="/cookies" component={Cookies} />
        <Route path="/preview/:id" component={FreeSken} />
        <Route path="/vzorovy-report" component={SampleReport} />

        {/* English routes (/en prefix) */}
        <Route path="/en" component={Home} />
        <Route path="/en/dashboard" component={Dashboard} />
        <Route path="/en/upload" component={Upload} />
        <Route path="/en/contract/:id" component={ContractDetail} />
        <Route path="/en/report/:id" component={Report} />
        <Route path="/en/admin" component={AdminPanel} />
        <Route path="/en/admin/review/:id" component={AdminReview} />
        <Route path="/en/about" component={About} />
        <Route path="/en/terms" component={VOP} />
        <Route path="/en/privacy" component={GDPR} />
        <Route path="/en/cookies" component={Cookies} />
        <Route path="/en/preview/:id" component={FreeSken} />
        <Route path="/en/sample-report" component={SampleReport} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
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
