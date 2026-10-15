import Link from "next/link";
import { Sparkles, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, { count: unread }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  return (
    <div className="flex min-h-svh bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-background py-4 md:flex">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 px-6 font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span>CareerCopilot</span>
        </Link>
        <SidebarNav />
      </aside>

      {/* Main column.
          `min-w-0` matters: without it this flex item's automatic minimum size
          is its content width, so a wide child (the résumé studio, which is a
          fixed 8.5in page between two rails) pushes the whole column past the
          viewport and the right-hand rail ends up off-screen instead of the
          canvas scrolling. */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
          <span className="text-sm font-medium text-muted-foreground md:hidden">
            CareerCopilot
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              {!!unread && unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <UserMenu email={user.email ?? ""} fullName={profile?.full_name} />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
