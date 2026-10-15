"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type WaitlistState =
  | { ok?: boolean; error?: string; firstName?: string }
  | undefined;

/**
 * Adds a Job Board waitlist signup. Works for signed-in and anonymous users
 * (waitlist_signups allows public insert via RLS). Accepts the richer landing
 * page fields (pronouns/stage/goals) in addition to the dashboard form's
 * name/email/linkedin.
 */
export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const linkedin = String(formData.get("linkedin") ?? "").trim();
  const pronouns = String(formData.get("pronouns") ?? "").trim();
  const stage = String(formData.get("stage") ?? "").trim();
  const goals = formData.getAll("goals").map(String).filter(Boolean);
  const source = String(formData.get("source") ?? "job_board").trim();

  if (!name) {
    return { error: "We need a name to say hi with." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { error: "That email doesn't look right — mind checking it?" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("waitlist_signups").insert({
    name,
    email,
    linkedin_url: linkedin || null,
    pronouns: pronouns || null,
    stage: stage || null,
    goals,
    user_id: user?.id ?? null,
    source,
  });

  const firstName = name.split(" ")[0];

  if (error) {
    // Unique violation on email → treat as already-joined success.
    if (error.code === "23505") return { ok: true, firstName };
    return { error: error.message };
  }

  return { ok: true, firstName };
}

/**
 * Real, live count of waitlist signups — used for landing-page social proof.
 * Uses the admin client deliberately: RLS scopes normal reads to "your own
 * rows only" (correct — visitors shouldn't list other people's emails), but
 * an aggregate COUNT with no rows returned is safe to compute server-side
 * and is the only way to get the true total rather than 0.
 */
export async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("waitlist_signups")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    // Landing page must render even if the DB is briefly unreachable —
    // callers fall back to a static display count when this returns 0.
    return 0;
  }
}
