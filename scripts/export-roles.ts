// Exports the role knowledge base used by the TypeScript résumé generator so the
// Python backend reasons from the same 24 role families (one source of truth).
import { ROLE_FAMILIES } from "../src/lib/resume/roleLibrary";

const out = ROLE_FAMILIES.map((r) => ({
  id: r.id,
  label: r.label,
  aliases: r.aliases,
  core_skills: r.coreSkills,
  tools: r.tools,
  skill_groups: r.groups,
  certifications: r.certifications ?? [],
}));
process.stdout.write(JSON.stringify(out, null, 2));
