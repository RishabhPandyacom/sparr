"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateProfile, type ProfileState } from "@/lib/settings/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  fullName,
  headline,
  targetRole,
}: {
  fullName: string;
  headline: string;
  targetRole: string;
}) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfile,
    undefined,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={headline}
          placeholder="CS student @ XYZ University"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="target_role">Target role</Label>
        <Input
          id="target_role"
          name="target_role"
          defaultValue={targetRole}
          placeholder="Software Engineer"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && (
        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
          <Check className="size-4" /> Saved
        </span>
      )}
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
