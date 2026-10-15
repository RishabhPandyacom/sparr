"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getBillingProvider } from "@/lib/billing";
import { createNotification } from "@/lib/notifications/service";

/** Simulates a plan purchase (mock provider) and opens the success page. */
export async function simulatePurchase(formData: FormData) {
  const user = await requireUser();
  const planSlug = String(formData.get("planSlug") ?? "free");

  const billing = getBillingProvider();
  const result = await billing.createCheckoutSession(user.id, planSlug);

  await createNotification(user.id, {
    type: "billing",
    title: "Plan updated",
    body: `You're now on the ${planSlug} plan. Interview credits refreshed.`,
    link: "/dashboard/billing",
  });

  revalidatePath("/dashboard", "layout");
  redirect(result.redirectUrl);
}
