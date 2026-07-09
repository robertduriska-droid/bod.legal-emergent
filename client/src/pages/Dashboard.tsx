import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { FileText, Upload, Clock, CheckCircle, AlertCircle, Loader2, Eye } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Čaká na spracovanie", variant: "secondary", icon: Clock },
  analyzing: { label: "AI analýza", variant: "outline", icon: Loader2 },
  in_review: { label: "Kontrola advokátom", variant: "default", icon: Eye },
  completed: { label: "Dokončené", variant: "default", icon: CheckCircle },
};

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: contracts, isLoading } = trpc.contracts.myContracts.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif">Moje zmluvy</h1>
              <p className="text-muted-foreground font-sans mt-1">Prehľad vašich odoslaných zmlúv a ich stav</p>
            </div>
            <Link href="/upload">
              <Button className="font-sans">
                <Upload className="mr-2 h-4 w-4" />
                Nahrať zmluvu
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !contracts || contracts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-sans text-xl font-semibold mb-2">Zatiaľ žiadne zmluvy</h3>
                <p className="text-muted-foreground font-sans mb-4">Nahrajte svoju prvú zmluvu a získajte analýzu rizík.</p>
                <Link href="/upload">
                  <Button className="font-sans">
                    <Upload className="mr-2 h-4 w-4" />
                    Nahrať zmluvu
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => {
                const status = STATUS_MAP[contract.status] || STATUS_MAP.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={contract.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-sans font-medium truncate">{contract.fileName}</p>
                            <p className="text-xs text-muted-foreground font-sans">
                              {new Date(contract.createdAt).toLocaleDateString("sk-SK")} · {contract.plan === "basic" ? "Základná" : contract.plan === "standard" ? "Štandardná" : "Prémiová"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={status.variant} className="font-sans text-xs">
                            <StatusIcon className={`h-3 w-3 mr-1 ${contract.status === "analyzing" ? "animate-spin" : ""}`} />
                            {status.label}
                          </Badge>
                          <Link href={contract.status === "completed" && contract.plan !== "basic" ? `/report/${contract.id}` : contract.plan === "basic" && contract.status !== "pending" ? `/preview/${contract.id}` : `/contract/${contract.id}`}>
                            <Button variant="ghost" size="sm" className="font-sans">
                              Zobraziť
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
