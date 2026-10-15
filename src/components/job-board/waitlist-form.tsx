"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { joinWaitlist, type WaitlistState } from "@/lib/waitlist/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WaitlistForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, formAction] = useActionState<WaitlistState, FormData>(
    joinWaitlist,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="size-8 text-emerald-500" />
        <p className="font-medium text-emerald-900">You&apos;re on the list! 🎉</p>
        <p className="text-sm text-emerald-700">
          We&apos;ll email you the moment the Auto-Apply Job Board opens.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={defaultName} placeholder="Ada Lovelace" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={defaultEmail} placeholder="you@example.com" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
        <Input id="linkedin" name="linkedin" placeholder="linkedin.com/in/you" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton>Join the waitlist</SubmitButton>
    </form>
  );
}
