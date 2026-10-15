"use client";

import { useState } from "react";
import { MessageSquare, ListChecks, Code2 } from "lucide-react";
import { startInterview } from "@/lib/interview/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const modes = [
  {
    value: "chat",
    icon: MessageSquare,
    title: "Behavioral chat",
    body: "Conversational Q&A with rule-based follow-ups and end-of-session feedback.",
  },
  {
    value: "mcq",
    icon: ListChecks,
    title: "MCQ round",
    body: "Auto-scored multiple-choice questions on your topic.",
  },
  {
    value: "coding",
    icon: Code2,
    title: "Coding challenge",
    body: "Solve a problem in a live editor; a rule-based review checks your solution.",
  },
];

export function InterviewSetup() {
  const [mode, setMode] = useState("chat");

  return (
    <form action={startInterview} className="grid gap-6">
      <input type="hidden" name="mode" value={mode} />

      <div className="grid gap-3 sm:grid-cols-3">
        {modes.map((m) => {
          const active = mode === m.value;
          return (
            <button
              type="button"
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  active ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <m.icon className="size-4.5" />
              </div>
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.body}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="topic">Topic (optional)</Label>
          <Input
            id="topic"
            name="topic"
            placeholder={
              mode === "coding" ? "Data structures" : "React, System design…"
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue="medium"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <SubmitButton>Start interview</SubmitButton>
    </form>
  );
}
