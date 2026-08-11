"use client"

import Image from "next/image"
import { projects } from "@/lib/projects"
import { meridianDeck } from "@/lib/case-study-deck"
import { DOCS } from "@/lib/constants"
import { hasSideProjects } from "@/components/chat/side-of-desk"

// The persistent left rail. It is the site's index: every project is a row,
// and clicking one streams that project's reveal into the chat. It replaces
// the old scrolling project grid entirely — see the note in app/page.tsx.
//
// Two classes of row, and the distinction is load-bearing:
//   - rows WITHOUT a right-hand meta talk back (they open a conversation)
//   - rows WITH a meta open a document (the deck viewer, the résumé PDF)
// That is the mock's rule and the only signal separating them, so the meta
// is not decoration.
//
// Labels are `projectTitle`, not `client`: three projects share the client
// "Complex NTWRK" and would otherwise render as three identical rows. The
// client sits UNDER the title as a secondary line rather than above it as an
// eyebrow — stacked eyebrows re-create the same collision at eye-entry
// height.

export type Pane = "chat" | "vibe-coding"

interface SidebarProps {
  activeSlug: string | null
  activePane: Pane
  onProjectSelect: (slug: string) => void
  onSelectVibeCoding: () => void
  onHome: () => void
  /** Mobile sheet only — dismisses after a selection. */
  onNavigate?: () => void
  /** Mobile sheet visibility. Desktop ignores it; see the media query. */
  open?: boolean
}

export function Sidebar({
  activeSlug,
  activePane,
  onProjectSelect,
  onSelectVibeCoding,
  onHome,
  onNavigate,
  open = false,
}: SidebarProps) {
  const pick = (fn: () => void) => () => {
    fn()
    onNavigate?.()
  }

  return (
    <aside className="rail" data-open={open} aria-label="Site index">
      <button type="button" className="rail-brand" onClick={pick(onHome)}>
        <span className="type-badge" style={{ color: "rgb(var(--bureau-text-primary))" }}>
          EdwinOS
        </span>
        <span className="rail-dot" />
        <span className="type-label" style={{ color: "rgb(var(--bureau-text-muted))" }}>
          Available
        </span>
      </button>

      <nav className="rail-scroll" aria-label="Work and documents">
        <p
          className="type-label rail-section"
          style={{ color: "rgb(var(--bureau-text-primary))" }}
        >
          Work
        </p>

        <div className="rail-list">
          {projects.map((p) => {
            const active = activePane === "chat" && activeSlug === p.slug
            return (
              <button
                key={p.slug}
                type="button"
                className="rail-item"
                data-active={active}
                aria-current={active ? "true" : undefined}
                onClick={pick(() => onProjectSelect(p.slug))}
              >
                {/* Decorative: the row's accessible name is the title beside
                    it, so alt="" avoids announcing the same project twice.
                    The source is 2048px square and renders at 32 — `sizes`
                    is what stops the optimizer shipping the full-size file. */}
                <Image
                  className="rail-thumb"
                  src={p.previewImage.url}
                  alt=""
                  width={32}
                  height={32}
                  sizes="32px"
                />
                <span className="rail-item-text">
                  {/* Truncation is CSS-only, so the full title stays in the
                      DOM for screen readers and for the accessible name. */}
                  <span className="type-caption rail-item-title">{p.projectTitle}</span>
                  <span className="type-meta rail-item-client">{p.client}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="rail-docs">
          {/* No meta — this one talks back rather than opening a file. */}
          {hasSideProjects && (
            <button
              type="button"
              className="rail-doc"
              data-active={activePane === "vibe-coding"}
              aria-current={activePane === "vibe-coding" ? "true" : undefined}
              onClick={pick(onSelectVibeCoding)}
            >
              <span className="type-label">Vibe Coding</span>
            </button>
          )}

          <a
            className="rail-doc"
            href={`/case-study/${meridianDeck.slug}`}
            onClick={() => onNavigate?.()}
          >
            <span className="type-label">Case Study</span>
            <span className="type-meta rail-doc-meta">
              Deck · {meridianDeck.slides.length} slides
            </span>
          </a>

          <a
            className="rail-doc"
            href={DOCS["resume"].url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onNavigate?.()}
          >
            <span className="type-label">Resume</span>
            <span className="type-meta rail-doc-meta">PDF</span>
          </a>
        </div>
      </nav>

      <div className="rail-footer">
        <p
          className="type-label rail-footer-label"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          <span className="rail-square" />
          Currently
        </p>
        {/* font-semibold is a Tailwind utility, not an inline type
            declaration — @layer components exists so utilities can step a
            .type-* class's weight without one. */}
        <p
          className="type-caption rail-footer-now font-semibold"
          style={{ color: "rgb(var(--bureau-text-primary))" }}
        >
          Designing the AI coach experience at FutureFit AI
        </p>
        <p className="type-caption" style={{ color: "rgb(var(--bureau-text-muted))", margin: 0 }}>
          Toronto, Canada
        </p>
        <a
          className="type-label rail-email"
          href={`mailto:${CONTACT_EMAIL}`}
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          Email
        </a>
      </div>
    </aside>
  )
}

// Sourced from lib/edwin-context.md § Contact, which takes it from resume.txt.
const CONTACT_EMAIL = "edwinsocrateslara@gmail.com"
