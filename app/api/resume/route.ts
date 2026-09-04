import { resume } from "@/lib/resume"

// The parsed résumé, as JSON, for the Resume pane to fetch when it opens.
//
// ── WHY A ROUTE AND NOT A PROP ────────────────────────────────────────────
//
// app/page.tsx used to parse lib/sources/resume.txt in a server component and
// pass the result into AppShell. That is the correct shape for a value the
// page needs — and the page does not need this one. AppShell is a client tree,
// so the prop was serialised into the home HTML on every visit: 6 roles, 21
// bullets, 6 skills bands and 3 education entries, delivered to everybody who
// never opened the Resume pane.
//
// The pane itself is already behind next/dynamic, so its CODE was split out.
// Its DATA was not, because a prop travels with the page rather than with the
// component. This is the endpoint that separates them.
//
// ── STILL ONE SOURCE ──────────────────────────────────────────────────────
//
// It imports lib/resume.ts, which parses lib/sources/resume.txt and throws
// loudly if the file's shape changed. Nothing is generated, cached to disk or
// retyped, so this cannot drift from the résumé the downloads are built from —
// they read the same parser.
//
// FORCE-STATIC, because the answer only changes when the source file does, and
// the source file changes at build time. Next renders this once and serves it
// from the edge; the pane pays a cache hit rather than a function invocation.
export const dynamic = "force-static"

export function GET() {
  return Response.json(resume, {
    headers: {
      // A year, immutable: a new deployment is a new build, and a build that
      // changed resume.txt produces a different response at the same URL. There
      // is no case where a client benefits from revalidating this within a
      // deployment.
      "cache-control": "public, max-age=31536000, immutable",
    },
  })
}
