"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { api, apiDownload, ApiError } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormBanner } from "@/components/plan/form-kit";

const PHRASE = "DELETE MY ACCOUNT";

export function PrivacyData({ consentVersion, consentAt }: { consentVersion: string | null; consentAt: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function exportData() {
    setExporting(true);
    setError(null);
    try {
      await apiDownload("/api/me/export", "sparr-my-data.json");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not export your data.");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      await api("/api/me", { method: "DELETE", json: { confirm: PHRASE } });
      await createClient().auth.signOut();
      window.location.href = "/?deleted=1";
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete your account.");
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <p className="text-sm text-text-secondary">
        {consentAt
          ? `You accepted privacy notice ${consentVersion} on ${new Date(consentAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}.`
          : "No consent record on this account."}{" "}
        <a href="/privacy" className="font-bold text-purple underline">Read the notice</a>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={exportData} disabled={exporting}>
          <Download /> {exporting ? "Preparing…" : "Download my data (JSON)"}
        </Button>
      </div>
      <div className="rounded-xl border-2 border-ink bg-pink-tint p-4">
        <h3 className="flex items-center gap-2 font-display text-base font-extrabold text-pink-dark"><Trash2 className="size-4" /> Delete my account</h3>
        <p className="mt-1 text-sm text-pink-dark/90">
          This permanently erases your profile, career plans, applications and everything else we hold. It cannot be undone.
          Type <strong>{PHRASE}</strong> to confirm.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Input aria-label="Type DELETE MY ACCOUNT to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={PHRASE} className="max-w-xs bg-white" />
          <Button variant="destructive" disabled={confirm !== PHRASE || deleting} onClick={deleteAccount}>
            {deleting ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </div>
      {error && <FormBanner tone="error">{error}</FormBanner>}
    </div>
  );
}
