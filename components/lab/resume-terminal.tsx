import type { Resume } from "@/lib/resume"

/* The résumé as shell output. Unapologetic: window chrome, a typed prompt, a
 * column of accent checkmarks.
 *
 * NOTHING IS RETYPED. Every employer, title and date below comes out of
 * lib/resume.ts, which parses lib/sources/resume.txt — the same rule the
 * Resume pane itself follows. The terminal is a second view of one record,
 * not a second copy of it. */
export function ResumeTerminal({ resume }: { resume: Resume }) {
  const lines = [
    ...resume.roles.map((r) => ({
      kind: "ok" as const,
      text: `${r.employer} — ${r.title} · ${r.dates}`,
    })),
    {
      kind: "info" as const,
      text: `${resume.roles.length} roles verified · ${resume.education.length} credentials on file · ${resume.skills.length} tool bands`,
    },
    { kind: "done" as const, text: "Done in 10 years." },
  ]

  return (
    <div className="lab-terminal">
      <div className="lab-term-bar">
        <span className="lab-term-dot" style={{ background: "#ff5f57" }} />
        <span className="lab-term-dot" style={{ background: "#febc2e" }} />
        <span className="lab-term-dot" style={{ background: "#28c840" }} />
      </div>
      <div className="lab-term-body">
        <div className="lab-term-prompt">&gt; edwin --resume --verify</div>
        {lines.map((l, i) => (
          <div className="lab-term-line" key={l.text} style={{ "--i": i } as React.CSSProperties}>
            {l.kind === "ok" && <span className="lab-term-tick">✔ </span>}
            {l.kind === "info" && <span className="lab-term-info">ℹ </span>}
            {l.kind === "done" && <span>  </span>}
            {l.text}
          </div>
        ))}
      </div>
    </div>
  )
}
