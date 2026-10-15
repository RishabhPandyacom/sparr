export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function ComingSoon({ note }: { note?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed text-center">
      <p className="text-sm font-medium">Coming soon</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {note ?? "This part of CareerCopilot is under construction."}
      </p>
    </div>
  );
}
