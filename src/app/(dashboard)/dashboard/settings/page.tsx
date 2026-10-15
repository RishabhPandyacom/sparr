import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { PrivacyData } from "@/components/settings/privacy-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, headline, target_role, privacy_consent_at, privacy_consent_version")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile and account." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            This info personalises your résumé and cover-letter drafts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            headline={profile?.headline ?? ""}
            targetRole={profile?.target_role ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/account">
              <KeyRound className="size-4" />
              Change password
            </Link>
          </Button>
          <form action={signOut}>
            <Button variant="ghost" type="submit" className="text-destructive">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacy &amp; data</CardTitle>
          <CardDescription>Your data, your call: take a copy or erase it.</CardDescription>
        </CardHeader>
        <CardContent>
          <PrivacyData
            consentVersion={profile?.privacy_consent_version ?? null}
            consentAt={profile?.privacy_consent_at ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
