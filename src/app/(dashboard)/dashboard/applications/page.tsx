import { apiServer } from "@/lib/api/server";
import type { Application } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/page-header";
import { ApplicationsBoard } from "@/components/applications/board";
import { ApiDown } from "@/components/plan/api-down";

export const metadata = { title: "Applications — Sparr" };

export default async function ApplicationsPage() {
  const apps = await apiServer<Application[]>("/api/applications");
  if (!apps) return <ApiDown />;
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader eyebrow="Pipeline" title="Applications" description="Log every role you go for and move it along as things progress. Stored privately in your account." />
      <ApplicationsBoard initial={apps} />
    </div>
  );
}
