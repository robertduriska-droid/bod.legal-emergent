import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";

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
const AIAct = lazy(() => import("./pages/AIAct"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse font-sans text-muted-foreground">Načítavam...</div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
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
        <Route path="/ai-act" component={AIAct} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
