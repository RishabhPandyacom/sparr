"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { submitMcq } from "@/lib/interview/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  prompt: string;
  options: { key: string; text: string }[];
};

export function McqRoom({
  sessionId,
  questions,
}: {
  sessionId: string;
  questions: Question[];
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const answered = Object.keys(selections).length;

  function submit() {
    startTransition(async () => {
      await submitMcq(sessionId, selections);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {answered} of {questions.length} answered
      </p>
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="space-y-3 py-5">
            <p className="font-medium">
              {i + 1}. {q.prompt}
            </p>
            <div className="grid gap-2">
              {q.options.map((opt) => {
                const selected = selections[q.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setSelections((s) => ({ ...s, [q.id]: opt.key }))
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium uppercase",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {opt.key}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={pending || answered === 0}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Submit answers
        </Button>
      </div>
    </div>
  );
}
