import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <span className="text-lg">CareerCopilot</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-xs text-muted-foreground">
        Your AI co-pilot for the job hunt.
      </p>
    </div>
  );
}
