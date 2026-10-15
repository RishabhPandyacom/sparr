import "server-only";
import { createClient } from "@/lib/supabase/server";

export type NotificationInput = {
  type?: string;
  title: string;
  body?: string;
  link?: string;
};

/**
 * Creates an in-app notification for a user. Called from server actions after
 * meaningful events (interview completed, cover letter ready, etc.). Uses the
 * request's authed client — RLS ensures a user only writes their own rows.
 *
 * Email/push delivery is intentionally stubbed for now (see providers/email).
 */
export async function createNotification(
  userId: string,
  input: NotificationInput,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    type: input.type ?? "system",
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    channel: "in_app",
  });
}
