"use client";

import { useState, useTransition } from "react";
import Editor from "@monaco-editor/react";
import { Loader2, Play } from "lucide-react";
import { submitCode } from "@/lib/interview/actions";
import { Button } from "@/components/ui/button";

export function CodingRoom({
  sessionId,
  questionId,
  prompt,
  starterCode,
  language,
}: {
  sessionId: string;
  questionId: string;
  prompt: string;
  starterCode: string;
  language: string;
}) {
  const [code, setCode] = useState(starterCode);
  const [pending, startTransition] = useTransition();

  const [title, ...rest] = prompt.split("\n\n");
  const body = rest.join("\n\n");

  function submit() {
    startTransition(async () => {
      await submitCode(sessionId, questionId, code, language);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      {/* Problem */}
      <div className="rounded-xl border bg-background p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Language: <span className="font-mono text-foreground">{language}</span>
        </p>
      </div>

      {/* Editor */}
      <div className="flex flex-col overflow-hidden rounded-xl border">
        <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">solution.js</span>
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Submit for review
          </Button>
        </div>
        <div className="h-[60vh]">
          <Editor
            height="100%"
            defaultLanguage={language}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            theme="vs-dark"
            options={{
              // Anti-cheat: Monaco renders its own right-click menu, so disable it here.
              contextmenu: false,
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
