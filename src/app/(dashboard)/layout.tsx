import Link from "next/link";
import { Sparkles, Bell, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
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
    <div className="flex min-h-svh bg-cream-app">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[258px] flex-col border-r-2 border-ink bg-ink py-5 md:flex">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-3 px-6 font-display text-xl font-extrabold tracking-tight text-cream"
        >
          <span className="flex size-9 items-center justify-center rounded-xl border-2 border-cream bg-lime shadow-[3px_3px_0_var(--brand-purple)]">
            <Sparkles className="size-4.5 text-ink" strokeWidth={2.25} />
          </span>
          Sparr
        </Link>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="mx-4 mt-4 rounded-2xl border border-cream/20 p-3.5 text-xs leading-relaxed text-cream/70">
          <div className="mb-1 flex items-center gap-1.5 font-mono-label font-bold uppercase tracking-wider text-lime">
            <ShieldCheck className="size-3.5" /> Rule-based
          </div>
          Every score and estimate shows its working. Nothing is sent to an
          external AI model.
        </div>
      </aside>

      {/* Main column.
          `min-w-0` matters: without it this flex item's automatic minimum size
          is its content width, so a wide child (the résumé studio, which is a
          fixed 8.5in page between two rails) pushes the whole column past the
          viewport and the right-hand rail ends up off-screen instead of the
          canvas scrolling. */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-[258px]">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-ink bg-cream-app/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <span className="font-display text-lg font-extrabold md:hidden">
              Sparr
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative flex size-10 items-center justify-center rounded-xl border-2 border-ink bg-white shadow-[2px_2px_0_var(--brand-ink)] transition hover:-translate-y-px"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              {!!unread && unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-ink bg-pink px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <UserMenu email={user.email ?? ""} fullName={profile?.full_name} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
