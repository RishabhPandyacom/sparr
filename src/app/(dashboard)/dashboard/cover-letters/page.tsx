import Link from "next/link";
import { Mail, Plus, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { deleteCoverLetter } from "@/lib/cover-letter/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function CoverLettersPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: letters } = await supabase
    .from("cover_letters")
    .select("id, title, company_name, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Cover Letters"
        description="Paste a job description and get a tailored letter in seconds."
      >
        <Button asChild>
          <Link href="/dashboard/cover-letters/new">
            <Plus className="size-4" />
            New cover letter
          </Link>
        </Button>
      </PageHeader>

      {!letters?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Mail className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No cover letters yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Generate your first tailored cover letter from a job description.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/cover-letters/new">
                <Plus className="size-4" />
                New cover letter
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {letters.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    updated {new Date(l.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/cover-letters/${l.id}/edit`}>Open</Link>
                </Button>
                <form action={deleteCoverLetter}>
                  <input type="hidden" name="id" value={l.id} />
                  <Button variant="ghost" size="icon-sm" type="submit" aria-label="Delete">
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
