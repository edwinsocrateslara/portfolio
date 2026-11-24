import { ResumePane } from "@/components/resume/resume-pane"
import { resume } from "@/lib/resume"

// /resume — the résumé, rendered on the server into this page's HTML. The
// shell (app/(site)/layout.tsx) places it in the pane and marks the rail's
// RESUME row active, because PANE_FOR_PATH maps this path to "resume".
//
// lib/resume.ts parses lib/sources/resume.txt at build time and throws if its
// shape changed, so a malformed source fails the build here rather than
// shipping an empty page. It is the same single parse the downloads are
// generated from (npm run build:resume) and the model's biography is
// reconciled against (check:context).
// The description is the résumé's own PROFESSIONAL SUMMARY, parsed from
// resume.txt — not copy written for this page. A description is what a search
// result shows, so it is a claim about Edwin and has to be sourced like one.
export const metadata = {
  title: "Resume — Edwin Socrates Lara",
  description: resume.summary,
}

export default function ResumePage() {
  return <ResumePane resume={resume} />
}
