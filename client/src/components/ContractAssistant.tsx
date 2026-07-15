import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSISTANT_MODELS, DEFAULT_ASSISTANT_MODEL } from "@shared/const";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Lang = "sk" | "cz" | "en";

const TX: Record<Lang, {
  title: string;
  subtitle: string;
  placeholder: string;
  empty: string;
  disclaimer: string;
  clear: string;
  error: string;
  attachLabel: string;
  attachNone: string;
  prompts: string[];
}> = {
  sk: {
    title: "AI právny asistent",
    subtitle: "Opýtajte sa čokoľvek k vašej zmluve a jej analýze. Asistent pozná zistenia z reportu.",
    placeholder: "Napíšte otázku k vašej zmluve...",
    empty: "Začnite konverzáciu o vašej zmluve",
    disclaimer: "Odpovede sú informatívne a nenahrádzajú kontrolu a podpis advokáta.",
    clear: "Vymazať",
    error: "Asistent momentálne neodpovedal. Skúste to prosím znova.",
    attachLabel: "Priložiť súbor",
    attachNone: "Bez súboru",
    prompts: [
      "Vysvetli mi najrizikovejšiu klauzulu",
      "Ako mám vyjednávať o tejto zmluve?",
      "Napíš email druhej strane s pripomienkami",
    ],
  },
  cz: {
    title: "AI právní asistent",
    subtitle: "Zeptejte se na cokoli k vaší smlouvě a její analýze. Asistent zná zjištění z reportu.",
    placeholder: "Napište otázku k vaší smlouvě...",
    empty: "Začněte konverzaci o vaší smlouvě",
    disclaimer: "Odpovědi jsou informativní a nenahrazují kontrolu a podpis advokáta.",
    clear: "Vymazat",
    error: "Asistent momentálně neodpověděl. Zkuste to prosím znovu.",
    attachLabel: "Přiložit soubor",
    attachNone: "Bez souboru",
    prompts: [
      "Vysvětli mi nejrizikovější klauzuli",
      "Jak mám vyjednávat o této smlouvě?",
      "Napiš e-mail druhé straně s připomínkami",
    ],
  },
  en: {
    title: "AI legal assistant",
    subtitle: "Ask anything about your contract and its analysis. The assistant knows the report findings.",
    placeholder: "Ask a question about your contract...",
    empty: "Start a conversation about your contract",
    disclaimer: "Answers are informational and do not replace review and sign-off by a lawyer.",
    clear: "Clear",
    error: "The assistant did not respond. Please try again.",
    attachLabel: "Attach file",
    attachNone: "No file",
    prompts: [
      "Explain the highest-risk clause",
      "How should I negotiate this contract?",
      "Draft an email to the counterparty with my comments",
    ],
  },
};

export default function ContractAssistant({
  contractId,
  language,
}: {
  contractId: number;
  language: string;
}) {
  const tx = TX[(language as Lang)] || TX.sk;
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_ASSISTANT_MODEL);
  const [attachmentId, setAttachmentId] = useState<number | null>(null);

  const historyQuery = trpc.assistant.history.useQuery({ contractId });
  const attachmentsQuery = trpc.attachments.list.useQuery({ contractId });
  const sendMutation = trpc.assistant.send.useMutation();
  const clearMutation = trpc.assistant.clear.useMutation();
  const attachmentOptions = attachmentsQuery.data || [];

  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data.map((m) => ({ role: m.role as Message["role"], content: m.content })));
    }
  }, [historyQuery.data]);

  const handleSend = async (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
    try {
      const res = await sendMutation.mutateAsync({
        contractId,
        message: content,
        model,
        attachmentId: attachmentId ?? undefined,
      });
      setMessages(res.messages.map((m) => ({ role: m.role as Message["role"], content: m.content })));
      setAttachmentId(null);
    } catch {
      toast.error(tx.error);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = async () => {
    try {
      await clearMutation.mutateAsync({ contractId });
      setMessages([]);
      await historyQuery.refetch();
    } catch {
      toast.error(tx.error);
    }
  };

  return (
    <div className="mb-8" data-testid="contract-assistant">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {tx.title}
        </h3>
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-8 w-[200px] text-xs" data-testid="assistant-model-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSISTANT_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} data-testid={`assistant-model-${m.id}`}>
                  {m.provider} · {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={clearMutation.isPending}
              data-testid="assistant-clear-button"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {tx.clear}
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{tx.subtitle}</p>
      {attachmentOptions.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap" data-testid="assistant-attach-row">
          <span className="text-xs text-muted-foreground">{tx.attachLabel}:</span>
          <Select
            value={attachmentId ? String(attachmentId) : "none"}
            onValueChange={(v) => setAttachmentId(v === "none" ? null : Number(v))}
          >
            <SelectTrigger className="h-8 w-[240px] text-xs" data-testid="assistant-attach-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" data-testid="assistant-attach-none">{tx.attachNone}</SelectItem>
              {attachmentOptions.map((a) => (
                <SelectItem key={a.id} value={String(a.id)} data-testid={`assistant-attach-${a.id}`}>
                  {a.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <AIChatBox
        messages={messages}
        onSendMessage={handleSend}
        isLoading={sendMutation.isPending}
        placeholder={tx.placeholder}
        emptyStateMessage={tx.empty}
        suggestedPrompts={tx.prompts}
        height="480px"
      />
      <p className="text-xs text-muted-foreground mt-2">{tx.disclaimer}</p>
    </div>
  );
}
