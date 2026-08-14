"use client"

import Image from "next/image"
import { Sparkle } from "@/components/ui/sparkle"
import { NewTabMark } from "@/components/ui/new-tab-mark"
import { projects } from "@/lib/projects"
import type { Project } from "@/lib/projects"
import { vibeProjects } from "@/lib/vibe-projects"
import { DOCS } from "@/lib/constants"

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

export type Pane = "chat" | "deck" | "about"

interface SidebarProps {
  activeSlug: string | null
  activePane: Pane
  onProjectSelect: (slug: string) => void
  onSelectAbout: () => void
  onSelectDeck: () => void
  onHome: () => void
  /** Mobile sheet only — dismisses after a selection. */
  onNavigate?: () => void
  /** Mobile sheet visibility. Desktop ignores it; see the media query. */
  open?: boolean
}

/** One rail section: a heading and its project rows. WORK and VIBE CODING are
 *  the same thing with different contents, so they are the same component —
 *  a second copy of this markup is a second place for the active treatment,
 *  the thumbnail rules and the truncation to drift. */
function ProjectSection({
  heading,
  items,
  activePane,
  activeSlug,
  onSelect,
  pick,
}: {
  heading: string
  items: Project[]
  activePane: Pane
  activeSlug: string | null
  onSelect: (slug: string) => void
  pick: (fn: () => void) => () => void
}) {
  return (
    <>
      <p
        className="type-label rail-section"
        style={{ color: "rgb(var(--bureau-text-primary))" }}
      >
        {heading}
      </p>

      <div className="rail-list">
        {items.map((p) => {
          const active = activePane === "chat" && activeSlug === p.slug
          return (
            <button
              key={p.slug}
              type="button"
              className="rail-item"
              data-active={active}
              aria-current={active ? "true" : undefined}
              onClick={pick(() => onSelect(p.slug))}
            >
              {/* Decorative: the row's accessible name is the title beside it,
                  so alt="" avoids announcing the same project twice. The source
                  is 2048px square and renders at 32 — `sizes` is what stops the
                  optimizer shipping the full-size file. */}
              {p.previewImage.url ? (
                <Image
                  className="rail-thumb"
                  src={p.previewImage.url}
                  alt=""
                  width={32}
                  height={32}
                  sizes="32px"
                />
              ) : (
                /* No image exists for this project yet. An empty frame, not a
                   borrowed screenshot from another project — the rail is where
                   it asserts what a project looks like. Keeping the 32px box
                   also keeps these rows aligned with the ones that have art. */
                <span className="rail-thumb rail-thumb-empty" aria-hidden="true" />
              )}
              <span className="rail-item-text">
                {/* Client above subtitle, mono above Archivo — the same order
                    and the same two type classes the chat's project-header card
                    uses, so the row reads as a miniature of the card the click
                    produces. Truncation is CSS-only: the full strings stay in
                    the DOM and in the row's accessible name. */}
                <span className="type-label rail-item-client">{p.client}</span>
                <span className="type-caption rail-item-subtitle">{p.railSubtitle}</span>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

export function Sidebar({
  activeSlug,
  activePane,
  onProjectSelect,
  onSelectAbout,
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
      {/* "Edwin Lara" at every width — one form, replacing both the rail's
          "Edwin Socrates Lara" and the top bar's "Edwin". The full name still
          stands on the résumé, the case-study header and the page title: it
          has left the app chrome, not the site. */}
      <button type="button" className="rail-brand" onClick={pick(onHome)}>
        <Sparkle size="var(--brand-mark-size)" />
        <span className="type-badge" style={{ color: "rgb(var(--bureau-text-primary))" }}>
          Edwin Lara
        </span>
      </button>

      <nav className="rail-scroll" aria-label="Work and documents">
        <ProjectSection
          heading="Work"
          items={projects}
          activePane={activePane}
          activeSlug={activeSlug}
          onSelect={onProjectSelect}
          pick={pick}
        />

        {/* Rendered only when there is something under it — a section heading
            above nothing is worse than no section.
            
            BOTH conditions, and each does a different job. The length check is
            the real one: it is what will start rendering the section when real
            entries exist. The NODE_ENV check is what lets the minifier fold
            this branch away in production, taking the "Vibe Coding" string
            literal with it — with the length check alone the heading survived
            in the client bundle, because vibeProjects is an imported binding
            the minifier cannot evaluate. Verified by grepping .next both ways. */}
        {process.env.NODE_ENV === "development" && vibeProjects.length > 0 && (
          <ProjectSection
            heading="Vibe Coding"
            items={vibeProjects}
            activePane={activePane}
            activeSlug={activeSlug}
            onSelect={onProjectSelect}
            pick={pick}
          />
        )}

        <div className="rail-docs">
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
            <NewTabMark />
          </a>

          {/* Last in the document group, and a pane swap rather than a route:
              About is not a deep-linkable artefact the way the deck is, and a
              real navigation remounts the shell and destroys every project
              thread. */}
          <button
            type="button"
            className="rail-doc"
            data-active={activePane === "about"}
            aria-current={activePane === "about" ? "true" : undefined}
            onClick={pick(onSelectAbout)}
          >
            <span className="type-label">About</span>
          </button>
        </div>
      </nav>

      <div className="rail-footer">
        <p
          className="type-label rail-footer-label"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          <span className="rail-square" />
          Contact
        </p>
        {/* Above the links, not stranded under them: where someone is is part
            of how you reach them, not a footnote. */}
        <p className="type-caption rail-footer-place" style={{ color: "rgb(var(--bureau-text-muted))" }}>
          Toronto, Canada
        </p>
        <div className="rail-contact">
          <a
            className="type-label rail-contact-link"
            href={`mailto:${CONTACT_EMAIL}`}
            style={{ color: "rgb(var(--bureau-text-secondary))" }}
          >
            Email
          </a>
          <a
            className="type-label rail-contact-link"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgb(var(--bureau-text-secondary))" }}
          >
            LinkedIn
            <NewTabMark />
          </a>
        </div>
      </div>
    </aside>
  )
}

// Sourced from lib/edwin-context.md § Contact, which takes it from resume.txt.
const CONTACT_EMAIL = "edwinsocrateslara@gmail.com"

// Sourced from lib/sources/resume.txt line 4, which carries it WITHOUT a
// scheme — `linkedin.com/in/edwinsocrateslara`. The https:// is added here
// rather than edited into the source: resume.txt is a frozen content file and
// the bare form is what the résumé itself prints. Note this one does NOT come
// via edwin-context.md — its § Contact lists only email and portfolio, so the
// chat cannot currently answer "what is his LinkedIn".
const LINKEDIN_URL = "https://linkedin.com/in/edwinsocrateslara"
