"use client"

import { Download } from "lucide-react"
import { DOCS } from "@/lib/constants"
import type { Resume } from "@/lib/resume"

// The résumé as pane content. Everything here is PARSED, never retyped — the
// data arrives as a prop from a server component that reads
// lib/sources/resume.txt at build time. See the note at the top of
// lib/resume.ts for why it cannot be imported directly here.
//
// Deliberately absent: the contact block and the professional summary. Contact
// is in the rail footer two hundred pixels away, and a third copy on this page
// would be the third on screen. The summary is marketing register — the roles
// carry the evidence, and Edwin's call was that it reads as written by someone
// else.
export function ResumePane({ resume }: { resume: Resume }) {
  return (
    <div>
      <div className="deck-head">
        <h1 className="type-h2 pane-title">Resume</h1>
        {/* Same control as the deck's, and the same reasoning: .chip is the
            system's pill, so a second inline one would be a second place for
            the border, fill and hover to drift. Still points at the hosted
            copy — a file in public/ replaces the URL and nothing else. */}
        {/* `download`, no target — it says "Download PDF" and now does that.
            It used to open DocHub in a tab, which is the mismatch that started
            the audit. Matches the deck pane's pill exactly. */}
        <a className="chip type-label deck-download" href={DOCS["resume"].url} download>
          <Download className="chip-icon" aria-hidden="true" strokeWidth={2} />
          Download PDF
        </a>
      </div>

      <p className="type-label pane-meta">Toronto, Canada</p>

      <section className="resume-section">
        <h2 className="type-label resume-heading">Experience</h2>
        {resume.roles.map((role) => (
          <article key={`${role.employer}-${role.dates}`} className="resume-role">
            {/* Two columns: the identifying facts left, the prose right. A
                résumé is scanned by employer and date before it is read, so
                those get their own column rather than opening a paragraph.
                Stacks below 900px, like the About mosaic. */}
            <div className="resume-role-meta">
              <p className="type-card-h3 resume-employer">{role.employer}</p>
              <p className="type-caption resume-title">{role.title}</p>
              <p className="type-meta resume-dates">{role.dates}</p>
            </div>
            <div className="resume-description">
              {role.groups.map((group, gi) => (
                <div key={group.label ?? gi} className="resume-group">
                  {/* Only the contracting block has labels — three clients
                      inside one engagement. Mono, so it reads as a divider in
                      the chrome voice rather than as another heading level. */}
                  {group.label && (
                    <p className="type-meta resume-group-label">{group.label}</p>
                  )}
                  <ul className="resume-bullets">
                    {group.bullets.map((bullet) => (
                      <li key={bullet} className="type-body resume-bullet">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="resume-section">
        <h2 className="type-label resume-heading">Education</h2>
        {resume.education.map((entry) => (
          <div key={entry.qualification} className="resume-education">
            <p className="type-card-h3 resume-employer">{entry.qualification}</p>
            <p className="type-caption resume-title">{entry.institution}</p>
          </div>
        ))}
      </section>

      <section className="resume-section">
        <h2 className="type-label resume-heading">Skills and methodologies</h2>
        {/* One wrapped block in source order, set in type. Not logos: twenty
            brand marks would be the only uncontrolled colour on the site, and
            check-design rule 6 exists to stop exactly that. Not chips either —
            a chip is a control and none of these is clickable.
            NOT SPLIT into tools and methods: that split is not in the source,
            so making it would mean deciding which side each item falls on,
            which is inventing structure rather than rendering it. */}
        <p className="type-meta resume-skills">{resume.skills.join(", ")}</p>
      </section>
    </div>
  )
}
