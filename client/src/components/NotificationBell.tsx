import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, FileText, CreditCard, Info, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useT } from "@/i18n";

const TX = {
  sk: {
    title: "Notifikácie",
    markAll: "Označiť všetky",
    empty: "Žiadne notifikácie",
    viewContract: "Zobraziť zmluvu \u2192",
    dateLocale: "sk-SK",
  },
  en: {
    title: "Notifications",
    markAll: "Mark all read",
    empty: "No notifications",
    viewContract: "View contract \u2192",
    dateLocale: "en-GB",
  },
  cz: {
    title: "Notifikace",
    markAll: "Označit všechny",
    empty: "Žádné notifikace",
    viewContract: "Zobrazit smlouvu \u2192",
    dateLocale: "cs-CZ",
  },
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  contract_submitted: FileText,
  contract_completed: Check,
  payment_received: CreditCard,
  comment_reply: MessageCircle,
  system: Info,
};

export default function NotificationBell() {
  const { locale, localePath } = useT();
  const tx = TX[locale];
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30s
  });
  const { data: notifications, refetch } = trpc.notifications.list.useQuery(undefined, {
    enabled: open,
  });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => refetch(),
  });

  const utils = trpc.useUtils();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        utils.notifications.unreadCount.invalidate();
      },
    });
  };

  const handleNotificationClick = (id: number, isRead: number) => {
    if (!isRead) {
      markRead.mutate({ id }, {
        onSuccess: () => {
          utils.notifications.unreadCount.invalidate();
        },
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-sans">
              {unreadCount! > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-sans font-semibold text-sm">{tx.title}</h4>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-sans h-auto py-1 px-2"
              onClick={handleMarkAllRead}
            >
              {tx.markAll}
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground font-sans">
              {tx.empty}
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(n.id, n.isRead)}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <Icon className={`h-4 w-4 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-sans ${!n.isRead ? "font-medium" : ""}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-sans mt-1">
                        {new Date(n.createdAt).toLocaleString(tx.dateLocale)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      </div>
                    )}
                  </div>
                  {n.contractId && (
                    <Link href={localePath(n.type === 'comment_reply' ? `/report/${n.contractId}` : `/contract/${n.contractId}`)}>
                      <span className="text-xs text-primary font-sans mt-1 inline-block hover:underline">
                        {tx.viewContract}
                      </span>
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
