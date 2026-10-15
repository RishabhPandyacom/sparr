import Link from "next/link";
import {
  FileText,
  Mail,
  MessageSquareCode,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const quickActions = [
  {
    title: "Generate a résumé or CV",
    description: "Type a role, get a full first draft.",
    href: "/dashboard/resumes/generate",
    icon: FileText,
  },
  {
    title: "Write a cover letter",
    description: "Tailored to any job description.",
    href: "/dashboard/cover-letters/new",
    icon: Mail,
  },
  {
    title: "Practice an interview",
    description: "Chat, MCQ, or coding rounds.",
    href: "/dashboard/interviews/new",
    icon: MessageSquareCode,
  },
  {
    title: "Negotiate your salary",
    description: "Know your worth before you talk.",
    href: "/dashboard/salary-negotiator",
    icon: Calculator,
  },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("usage_credits")
      .select("interviews_used, interviews_limit")
      .eq("user_id", user.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const used = usage?.interviews_used ?? 0;
  const limit = usage?.interviews_limit ?? 3;
  const unlimited = limit === -1;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          Everything you need to land your next role, in one place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interview credits</CardTitle>
          <CardDescription>
            {unlimited
              ? "You have unlimited mock interviews."
              : `You've used ${used} of ${limit} interviews this period.`}
          </CardDescription>
        </CardHeader>
        {!unlimited && (
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (used / Math.max(limit, 1)) * 100)}%`,
                }}
              />
            </div>
            <Link
              href="/dashboard/billing"
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Need more? Upgrade your plan <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/40">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="size-5" />
                </div>
                <CardTitle className="mt-2 text-base">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
