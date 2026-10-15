import Link from "next/link";
import {
  Bell,
  MessageSquareCode,
  Mail,
  CreditCard,
  CheckCheck,
  Check,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const typeIcon: Record<string, typeof Bell> = {
  interview: MessageSquareCode,
  cover_letter: Mail,
  billing: CreditCard,
  system: Bell,
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = notifications?.some((n) => !n.is_read);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" description="Updates, reminders, and results.">
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <Button variant="outline" size="sm" type="submit">
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          </form>
        )}
      </PageHeader>

      {!notifications?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Bell className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">You&apos;re all caught up</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Finish an interview or generate a cover letter — updates will show
              up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {notifications.map((n) => {
            const Icon = typeIcon[n.type] ?? Bell;
            const markRead = markNotificationRead.bind(null, n.id);
            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-colors",
                  !n.is_read && "border-primary/30 bg-primary/[0.03]",
                )}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  <div
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                      n.is_read
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.is_read && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    {n.body && (
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                    {n.link && (
                      <Link
                        href={n.link}
                        className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                  {!n.is_read && (
                    <form action={markRead}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="submit"
                        aria-label="Mark read"
                      >
                        <Check className="size-4 text-muted-foreground" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
