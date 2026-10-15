import { Briefcase, Sparkles, Zap, BellRing } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { WaitlistForm } from "@/components/job-board/waitlist-form";
import { Card, CardContent } from "@/components/ui/card";

const perks = [
  { icon: Zap, title: "Auto-apply", body: "We tailor and submit applications for you, at scale." },
  { icon: Sparkles, title: "Smart matching", body: "Roles ranked to your resume and preferences." },
  { icon: BellRing, title: "Instant alerts", body: "Be first to new roles that fit you." },
];

export default async function JobBoardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Auto-Apply Job Board"
        description="Coming soon — the job board that applies for you."
      />

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="size-6" />
          </div>
          <div className="space-y-4">
            {perks.map((p) => (
              <div key={p.title} className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <p.icon className="size-4 text-foreground" />
                </div>
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-1 font-semibold">Join the waitlist</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Be first in line when we launch.
            </p>
            <WaitlistForm
              defaultName={profile?.full_name ?? ""}
              defaultEmail={user.email ?? ""}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
