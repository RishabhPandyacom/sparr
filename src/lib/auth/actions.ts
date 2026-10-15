"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export type AuthResult = { error: string } | undefined;

/**
 * Sign in with email + password. On success, redirects to the dashboard
 * (or the page the user was originally trying to reach).
 */
export async function signIn(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo || "/dashboard");
}

/**
 * Create an account. With local email confirmation disabled, this signs the
 * user straight in.
 */
export async function signUp(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  // Consent is recorded, not assumed: no ticked box, no account.
  if (formData.get("consent") !== "on") {
    return {
      error: "Please read and accept the privacy notice to create an account.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        privacy_consent_version: PRIVACY_NOTICE_VERSION,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If confirmation is required (hosted default), there is no active session.
  if (!data.session) {
    redirect("/login?checkEmail=1");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Sign the current user out and return to the landing page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
