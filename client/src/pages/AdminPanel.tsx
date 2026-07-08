import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { FileText, Loader2, Clock, Eye, CheckCircle, AlertTriangle } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "Čaká", variant: "secondary", color: "text-muted-foreground" },
  analyzing: { label: "AI analýza", variant: "outline", color: "text-blue-600" },
  in_review: { label: "Na kontrolu", variant: "destructive", color: "text-amber-600" },
  completed: { label: "Dokončené", variant: "default", color: "text-green-600" },
};

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: contracts, isLoading } = trpc.admin.allContracts.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-xl mb-2">Prístup zamietnutý</h2>
            <p className="text-muted-foreground font-sans">Táto sekcia je dostupná len pre administrátorov.</p>
          </div>
        </main>
      </div>
    );
  }

  const pendingReview = contracts?.filter(c => c.status === "in_review") || [];
  const analyzing = contracts?.filter(c => c.status === "analyzing" || c.status === "pending") || [];
  const completed = contracts?.filter(c => c.status === "completed") || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <h1 className="text-3xl font-serif mb-2">Admin panel</h1>
          <p className="text-muted-foreground font-sans mb-8">Prehľad a kontrola všetkých zmlúv</p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif">{contracts?.length || 0}</p>
                <p className="text-xs text-muted-foreground font-sans">Celkom</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif text-amber-600">{pendingReview.length}</p>
                <p className="text-xs text-amber-600 font-sans">Na kontrolu</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif text-blue-600">{analyzing.length}</p>
                <p className="text-xs text-blue-600 font-sans">Spracováva sa</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif text-green-600">{completed.length}</p>
                <p className="text-xs text-green-600 font-sans">Dokončené</p>
              </CardContent>
            </Card>
          </div>

          {/* Contracts needing review first */}
          {pendingReview.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Čakajú na kontrolu ({pendingReview.length})
              </h2>
              <div className="space-y-3">
                {pendingReview.map((contract) => (
                  <Card key={contract.id} className="border-amber-200 hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-sans font-medium truncate">{contract.fileName}</p>
                            <p className="text-xs text-muted-foreground font-sans">
                              {new Date(contract.createdAt).toLocaleDateString("sk-SK")} · Plán: {contract.plan}
                            </p>
                          </div>
                        </div>
                        <Link href={`/admin/review/${contract.id}`}>
                          <Button size="sm" className="font-sans">
                            <Eye className="mr-1 h-4 w-4" /> Skontrolovať
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All contracts */}
          <h2 className="text-xl font-serif mb-4">Všetky zmluvy</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {contracts?.map((contract) => {
                const status = STATUS_MAP[contract.status] || STATUS_MAP.pending;
                return (
                  <Card key={contract.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-sans text-sm truncate">{contract.fileName}</span>
                          <Badge variant={status.variant} className="font-sans text-xs shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground font-sans">
                            {new Date(contract.createdAt).toLocaleDateString("sk-SK")}
                          </span>
                          <Link href={`/admin/review/${contract.id}`}>
                            <Button variant="ghost" size="sm" className="font-sans text-xs">Otvoriť</Button>
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
