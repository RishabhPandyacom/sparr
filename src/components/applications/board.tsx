"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { AppStatus, Application } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton, FormBanner, FormField } from "@/components/plan/form-kit";
import { cn } from "@/lib/utils";

const COLUMNS: { status: AppStatus; label: string; tone: string }[] = [
  { status: "wishlist", label: "Wishlist", tone: "bg-cyan" },
  { status: "applied", label: "Applied", tone: "bg-amber" },
  { status: "interviewing", label: "Interviewing", tone: "bg-purple text-cream" },
  { status: "offer", label: "Offer", tone: "bg-lime" },
  { status: "rejected", label: "Rejected", tone: "bg-pink-tint text-pink-dark" },
];

const blank = { company: "", role: "", status: "wishlist" as AppStatus, job_url: "", location: "", notes: "" };

export function ApplicationsBoard({ initial }: { initial: Application[] }) {
  const [apps, setApps] = useState<Application[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  function check() {
    const e: Record<string, string> = {};
    if (!form.company.trim()) e.company = "Which company is it?";
    if (!form.role.trim()) e.role = "What is the role called?";
    if (form.job_url && !/^https?:\/\//.test(form.job_url)) e.job_url = "Link must start with http:// or https://";
    return e;
  }

  async function add(ev: React.FormEvent) {
    ev.preventDefault();
    const e = check();
    setErrors(e);
    if (Object.keys(e).length) return;
    setPending(true);
    setBanner(null);
    try {
      const created = await api<Application>("/api/applications", {
        method: "POST",
        json: {
          company: form.company.trim(),
          role: form.role.trim(),
          status: form.status,
          job_url: form.job_url.trim() || null,
          location: form.location.trim() || null,
          notes: form.notes.trim() || null,
        },
      });
      setApps((a) => [created, ...a]);
      setForm(blank);
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setBanner(err.message);
      } else setBanner("Could not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function move(app: Application, status: AppStatus) {
    const previous = apps;
    setListError(null);
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, status } : a)));
    try {
      await api(`/api/applications/${app.id}`, { method: "PATCH", json: { status } });
    } catch (err) {
      setApps(previous);
      setListError(err instanceof ApiError ? err.message : "Could not move that application.");
    }
  }

  async function remove(app: Application) {
    const previous = apps;
    setApps((list) => list.filter((a) => a.id !== app.id));
    try {
      await api(`/api/applications/${app.id}`, { method: "DELETE" });
    } catch (err) {
      setApps(previous);
      setListError(err instanceof ApiError ? err.message : "Could not delete that application.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">{apps.length} tracked</p>
        <Button onClick={() => setOpen((o) => !o)} variant={open ? "outline" : "default"}>
          {open ? <><X /> Close</> : <><Plus /> Add application</>}
        </Button>
      </div>

      {open && (
        <form onSubmit={add} noValidate className="mb-8 grid gap-4 rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)] sm:grid-cols-2">
          <FormField id="company" label="Company" error={errors.company}>
            <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={120} aria-invalid={!!errors.company} />
          </FormField>
          <FormField id="role" label="Role" error={errors.role}>
            <Input id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} maxLength={120} aria-invalid={!!errors.role} />
          </FormField>
          <FormField id="status" label="Stage">
            <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppStatus })} className="h-10 w-full rounded-xl border-2 border-ink bg-white px-3 text-sm font-semibold">
              {COLUMNS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
            </select>
          </FormField>
          <FormField id="location" label="Location" optional>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={120} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField id="job_url" label="Job link" optional error={errors.job_url}>
              <Input id="job_url" value={form.job_url} onChange={(e) => setForm({ ...form, job_url: e.target.value })} placeholder="https://" aria-invalid={!!errors.job_url} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField id="notes" label="Notes" optional>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} />
            </FormField>
          </div>
          {banner && <div className="sm:col-span-2"><FormBanner tone="error">{banner}</FormBanner></div>}
          <div className="flex justify-end sm:col-span-2">
            <ActionButton type="submit" pending={pending}>Save application</ActionButton>
          </div>
        </form>
      )}

      {listError && <div className="mb-4"><FormBanner tone="error">{listError}</FormBanner></div>}

      {apps.length === 0 && !open ? (
        <div className="rounded-3xl border-2 border-dashed border-ink p-12 text-center">
          <h2 className="font-display text-xl font-extrabold">Nothing tracked yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">Add the first role you are interested in. You can drag it along the pipeline with the stage menu.</p>
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = apps.filter((a) => a.status === col.status);
            return (
              <section key={col.status} aria-label={col.label} className="min-w-[220px]">
                <h2 className={cn("mb-3 flex items-center justify-between rounded-xl border-2 border-ink px-3 py-2 font-mono-label text-xs font-bold uppercase tracking-wider", col.tone)}>
                  {col.label} <span>{items.length}</span>
                </h2>
                <ul className="grid gap-3">
                  {items.map((a) => (
                    <li key={a.id} className="rounded-2xl border-2 border-ink bg-white p-3.5 shadow-[3px_3px_0_var(--brand-ink)]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-display text-base font-extrabold leading-tight">{a.company}</div>
                          <div className="text-sm text-text-secondary">{a.role}</div>
                        </div>
                        <button type="button" aria-label={`Delete ${a.company}`} onClick={() => remove(a)} className="rounded-md p-1 text-text-muted hover:bg-surface hover:text-pink-dark">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {a.location && <div className="mt-1 text-xs text-text-muted">{a.location}</div>}
                      {a.notes && <p className="mt-2 line-clamp-3 text-xs text-text-secondary">{a.notes}</p>}
                      <div className="mt-3 flex items-center gap-2">
                        <select aria-label={`Move ${a.company}`} value={a.status} onChange={(e) => move(a, e.target.value as AppStatus)} className="h-8 min-w-0 flex-1 rounded-lg border-2 border-ink bg-cream px-2 text-xs font-bold">
                          {COLUMNS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
                        </select>
                        {a.job_url && (
                          <a href={a.job_url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${a.company} posting`} className="rounded-md p-1.5 hover:bg-surface">
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
