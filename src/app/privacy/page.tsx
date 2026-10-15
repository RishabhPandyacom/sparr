import Link from "next/link";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export const metadata = { title: "Privacy notice — Sparr" };

const rows: [string, string][] = [
  ["What we collect", "Your name and email, and the career details you type in: résumé content, target role, location, salary figures and job applications."],
  ["Why", "Only to run the tools you use: the readiness score, salary estimate, negotiation script, action plan and application tracker."],
  ["Where it lives", "A Supabase (PostgreSQL) database. Row-level security means one account can only read its own rows. The Python API forwards your sign-in token, so the database enforces this, not just our code."],
  ["Who sees it", "You. Sparr's tools are rule-based: your data is not sent to any external AI model, advertiser or data broker."],
  ["Your rights", "Download everything we hold as JSON, or permanently delete your account and all its data, any time from Settings → Privacy & data."],
  ["Keeping it small", "Salary and résumé inputs are optional. Estimates are indicative only and are never a promise of an offer."],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <Link href="/" className="font-mono-label text-xs font-bold uppercase tracking-wider text-purple">
        ← Back to Sparr
      </Link>
      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Privacy notice</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Version {PRIVACY_NOTICE_VERSION}. Written to follow the spirit of the Australian Privacy
        Principles (Privacy Act 1988): collect only what is needed, say why, let people see and erase it.
      </p>
      <dl className="mt-8 grid gap-4">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)]">
            <dt className="font-display text-lg font-extrabold">{k}</dt>
            <dd className="mt-1 text-text-secondary">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-sm text-text-secondary">
        Sparr is a student project built for BUS4012, not a commercial service. Questions: use the
        email on your account&apos;s profile page.
      </p>
    </main>
  );
}
