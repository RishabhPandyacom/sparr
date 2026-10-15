"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { answerChat, finishChat } from "@/lib/interview/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Turn = { role: "ai" | "user"; content: string };

export function ChatRoom({
  sessionId,
  initialTurns,
  initialQuestionId,
}: {
  sessionId: string;
  initialTurns: Turn[];
  initialQuestionId: string | null;
}) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [questionId, setQuestionId] = useState<string | null>(initialQuestionId);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(questionId === null);
  const [sending, startSend] = useTransition();
  const [finishing, startFinish] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  function scrollToEnd() {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  function send() {
    const answer = input.trim();
    if (!answer || !questionId) return;
    setTurns((t) => [...t, { role: "user", content: answer }]);
    setInput("");
    scrollToEnd();
    startSend(async () => {
      const res = await answerChat(sessionId, questionId, answer);
      if (res.error) return;
      if (res.done || !res.nextPrompt) {
        setDone(true);
        setQuestionId(null);
      } else {
        setTurns((t) => [...t, { role: "ai", content: res.nextPrompt! }]);
        setQuestionId(res.nextQuestionId ?? null);
      }
      scrollToEnd();
    });
  }

  function finish() {
    startFinish(async () => {
      await finishChat(sessionId);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {turns.map((t, i) => (
          <div key={i} className={cn("flex gap-3", t.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                t.role === "ai" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {t.role === "ai" ? <Sparkles className="size-4" /> : "You"}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                t.role === "ai"
                  ? "rounded-tl-sm bg-muted"
                  : "rounded-tr-sm bg-primary text-primary-foreground",
              )}
            >
              {t.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {done ? (
        <div className="rounded-lg border bg-muted/40 p-4 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            That&apos;s a wrap! Get your personalized feedback and score.
          </p>
          <Button onClick={finish} disabled={finishing}>
            {finishing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Finish & get feedback
          </Button>
        </div>
      ) : (
        <div className="sticky bottom-4 flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="min-h-0 resize-none border-0 shadow-none focus-visible:ring-0"
            disabled={sending}
          />
          <Button size="icon" onClick={send} disabled={sending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
