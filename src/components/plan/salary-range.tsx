import type { SalaryEstimate } from "@/lib/api/types";

const symbol: Record<string, string> = { AUD: "A$", USD: "US$", GBP: "£" };
export const money = (n: number, cur: string) => `${symbol[cur] ?? ""}${Math.round(n).toLocaleString("en-AU")}`;

/** Low–high bar with mid, ask and walk-away marked, plus the full working. */
export function SalaryRange({ estimate: e, compact = false }: { estimate: SalaryEstimate; compact?: boolean }) {
  const lo = Math.min(e.low, e.walk_away) * 0.95;
  const hi = Math.max(e.high, e.recommended_ask) * 1.05;
  const pos = (n: number) => `${Math.max(0, Math.min(100, ((n - lo) / (hi - lo)) * 100))}%`;
  return (
    <div>
      <div className="relative mt-8 h-4 rounded-full border-2 border-ink bg-white">
        <div className="absolute inset-y-0 rounded-full bg-cyan" style={{ left: pos(e.low), width: `calc(${pos(e.high)} - ${pos(e.low)})` }} />
        {[
          { v: e.mid, label: "Mid", c: "bg-ink" },
          { v: e.recommended_ask, label: "Ask", c: "bg-purple" },
          { v: e.walk_away, label: "Walk-away", c: "bg-pink" },
        ].map((m) => (
          <div key={m.label} className="absolute -top-6 -translate-x-1/2" style={{ left: pos(m.v) }}>
            <div className="text-center font-mono-label text-[9px] font-bold uppercase leading-none">{m.label}</div>
            <div className={`mx-auto mt-1 h-7 w-1 ${m.c}`} />
          </div>
        ))}
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ["Low", e.low],
          ["Typical", e.mid],
          ["High", e.high],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl border-2 border-ink bg-white p-2">
            <dt className="font-mono-label text-[10px] font-bold uppercase text-text-muted">{k}</dt>
            <dd className="font-display text-sm font-extrabold sm:text-base">{money(v as number, e.currency)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm">
        Suggested ask <strong>{money(e.recommended_ask, e.currency)}</strong>, walk-away{" "}
        <strong>{money(e.walk_away, e.currency)}</strong>.
      </p>
      {e.target_comment && <p className="mt-2 text-xs text-text-secondary">{e.target_comment}</p>}
      {e.offer_comment && <p className="mt-1 text-xs text-text-secondary">{e.offer_comment}</p>}
      {!compact && (
        <>
          <h3 className="mt-6 font-display text-base font-extrabold">How we got here</h3>
          <ul className="mt-2 grid gap-1.5">
            {e.breakdown.map((b) => (
              <li key={b.label} className="flex items-baseline gap-3 rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-sm">
                <span className="w-24 shrink-0 font-bold">{b.label}</span>
                <span className="w-20 shrink-0 font-mono-label text-xs font-bold text-purple">{b.value}</span>
                <span className="text-text-secondary">{b.effect}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 list-disc pl-5 text-xs text-text-secondary">
            {e.assumptions.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
