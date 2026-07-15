import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Classic email + password auth form. Reuses the app's session cookie, so on
 * success we simply reload to let the existing auth check pick up the session.
 */
export default function EmailAuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const pending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email, password });
      } else {
        await registerMutation.mutateAsync({ email, password, name: name || undefined });
      }
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    }
  };

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3" data-testid="email-auth-form">
      {mode === "register" && (
        <input
          className={inputCls}
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="email-auth-name"
        />
      )}
      <input
        className={inputCls}
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-auth-email"
      />
      <input
        className={inputCls}
        type="password"
        required
        minLength={mode === "register" ? 8 : undefined}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="email-auth-password"
      />
      <Button type="submit" size="lg" className="w-full" disabled={pending} data-testid="email-auth-submit">
        {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {mode === "login" ? "Sign in with email" : "Create account"}
      </Button>
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground underline self-center"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        data-testid="email-auth-toggle"
      >
        {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
