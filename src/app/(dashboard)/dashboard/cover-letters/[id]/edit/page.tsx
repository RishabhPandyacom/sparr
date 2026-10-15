import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { CoverLetterEditor } from "@/components/cover-letter/cover-letter-editor";

export default async function EditCoverLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: letter } = await supabase
    .from("cover_letters")
    .select("id, title, generated_content, edited_content")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!letter) notFound();

  return (
    <CoverLetterEditor
      id={letter.id}
      title={letter.title}
      initialText={letter.edited_content ?? letter.generated_content ?? ""}
    />
  );
}
