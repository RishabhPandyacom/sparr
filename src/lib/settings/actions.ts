"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok?: boolean; error?: string } | undefined;

/** Updates the user's profile fields. */
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const supabase = await createClient();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const target_role = String(formData.get("target_role") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, headline: headline || null, target_role: target_role || null })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
