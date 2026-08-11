"use client"

import Image from "next/image"
import { projects } from "@/lib/projects"
import { DOCS } from "@/lib/constants"
import { hasSideProjects } from "@/components/chat/side-of-desk"

// The persistent left rail. It is the site's index: every project is a row,
// and clicking one streams that project's reveal into the chat. It replaces
// the old scrolling project grid entirely — see the note in app/page.tsx.
//
// Project rows open a conversation; CASE STUDY and RESUME open documents.
// The handoff distinguished the two with a right-aligned mono meta ("DECK ·
// 21 SLIDES", "PDF"); those have been removed, so the only remaining cue is
// that document rows carry no thumbnail and sit below a gap. See the note in
// the branch report — this is a deliberate reduction, not an oversight.
//
// A row is `client` over `railSubtitle`, mirroring the chat's project-header
// card. Three projects share the client "Complex NTWRK", so the top line
// repeats on three rows; `railSubtitle` is what tells them apart (Live
// Selling / E-commerce / Product Management). `projectTitle` is deliberately
// NOT shown here — it stays the project's name in the chat card and in
// edwin-context.md, and is too long for a 198px column.

export type Pane = "chat" | "vibe-coding" | "deck"

interface SidebarProps {
  activeSlug: string | null
  activePane: Pane
  onProjectSelect: (slug: string) => void
  onSelectVibeCoding: () => void
  onSelectDeck: () => void
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
  onSelectDeck,
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
                  {/* Client above subtitle, mono above Archivo — the same
                      order and the same two type classes the chat's
                      project-header card uses, so the row reads as a
                      miniature of the card the click produces. Truncation is
                      CSS-only: the full strings stay in the DOM and in the
                      row's accessible name. */}
                  <span className="type-label rail-item-client">{p.client}</span>
                  <span className="type-caption rail-item-subtitle">{p.railSubtitle}</span>
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

          {/* A button, not a link: navigating to /case-study/meridian-deck
              would remount the shell and lose every project thread. The route
              still exists for deep links and renders this same shell. */}
          <button
            type="button"
            className="rail-doc"
            data-active={activePane === "deck"}
            aria-current={activePane === "deck" ? "true" : undefined}
            onClick={pick(onSelectDeck)}
          >
            <span className="type-label">Case Study</span>
          </button>

          <a
            className="rail-doc"
            href={DOCS["resume"].url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onNavigate?.()}
          >
            <span className="type-label">Resume</span>
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
