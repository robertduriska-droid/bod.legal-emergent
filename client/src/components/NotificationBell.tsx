import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, FileText, CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const TYPE_ICONS: Record<string, typeof Bell> = {
  contract_submitted: FileText,
  contract_completed: Check,
  payment_received: CreditCard,
  system: Info,
};

export default function NotificationBell() {
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
          <h4 className="font-sans font-semibold text-sm">Notifikácie</h4>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-sans h-auto py-1 px-2"
              onClick={handleMarkAllRead}
            >
              Označiť všetky
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground font-sans">
              Žiadne notifikácie
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
                        {new Date(n.createdAt).toLocaleString("sk-SK")}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      </div>
                    )}
                  </div>
                  {n.contractId && (
                    <Link href={`/contract/${n.contractId}`}>
                      <span className="text-xs text-primary font-sans mt-1 inline-block hover:underline">
                        Zobraziť zmluvu →
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
