export function PageHeader({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-purple">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function ComingSoon({ note }: { note?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink text-center">
      <p className="font-display text-lg font-extrabold">Coming soon</p>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">
        {note ?? "This part of Sparr is under construction."}
      </p>
    </div>
  );
}
