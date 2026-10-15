# Product

## Register

product

Marketing surfaces (landing, pricing, waitlist) run brand register; the dashboard/app runs product register. Both draw from one shared visual system (see DESIGN.md) — marketing pages lean into the full maximalist expression (hero, marquee, floating cards), the dashboard applies the same tokens more functionally (dark sidebar, restrained card surfaces, same borders/shadows/type).

## Users

Students and early-career job seekers (explicitly Gen Z-voiced: "Made for Gen Z, by Gen Z") navigating the job hunt — practicing interviews, building resumes, writing cover letters, negotiating offers. They're doing this solo, often anxious about it, comparing themselves to peers, and tired of juggling a dozen disconnected tools (resume builder here, mock interview app there, a Google Doc for cover letters, a spreadsheet for salary research).

## Product Purpose

One subscription that replaces that whole scattered toolkit: AI mock interviews (chat/MCQ/coding), an ATS-proof resume builder, AI cover letters, a salary negotiation coach, and (soon) an auto-apply job board — with reminders so nothing slips. Success = a student walks in more prepared and negotiates a better outcome than they would have alone.

## Brand Personality

Loud, confident, irreverent, anti-corporate — the opposite of stiff HR-software beige. Talks like a peer, not a career counselor ("Land the job. Not the existential dread."). Neobrutalist/sticker visual language: thick black borders, hard offset drop-shadows, saturated color used without apology. Playful details (floating badge cards, marquee ticker, blinking "live" dot) signal energy and momentum, not corporate polish. Confidence without arrogance — "no gatekeeping," peer proof (avatars, real numbers), score/feedback framed as coaching, not judgment.

## Anti-references

- Generic SaaS-cream minimalism (soft muted grays, one timid accent, tiny tracked eyebrows) — this brand is drenched in color and unapologetically loud, not restrained.
- Corporate HR/career-services tone — no "leverage," "synergy," "unlock your potential" copy. Talk like a smart friend.
- Stock-photo LinkedIn-influencer aesthetic — replaced with the sticker/neobrutalist illustration system (abstract shapes, badge cards, iconography) rather than generic photography.

## Design Principles

- **Faithful implementation, not reinterpretation.** A confirmed design system already exists (`design/gen-z-landing/*.dc.html`, one file per page) — the job is high-craft, production-quality translation into the real app, not redesigning it.
- **One token system, two registers.** Landing/marketing pages get the full maximalist treatment (hero energy, marquee, floating cards); the dashboard applies the same colors/type/border/shadow language more functionally, since users return to it repeatedly to do work.
- **Confidence over caution.** Bold color and hard shadows are the brand, not a phase to tone down — don't soften this into generic SaaS during implementation.
- **Real motion, real restraint.** Marquee/float/blink animations carry personality; all must have a `prefers-reduced-motion` fallback.
- **Peer voice everywhere**, including UI copy, empty states, and error messages — never corporate.

## Accessibility & Inclusion

- WCAG AA contrast minimum despite the bold palette — verify every color pairing (white text on saturated purple/pink, dark ink on lime/amber, etc.) before shipping.
- Full `prefers-reduced-motion` alternatives for the marquee scroll, floating-card bob, and blinking-dot animations (crossfade or static instead).
- Keyboard-navigable nav, forms, and interactive cards; visible focus states (the design already specifies a purple focus ring — keep it, don't rely on the hard shadow alone as a focus indicator).
