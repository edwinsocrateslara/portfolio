"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Sparkle } from "@/components/ui/sparkle"
// Layers, not Layers3: Layers3 is a deprecated alias in v0.544 and resolves to
// the same component (verified: Layers3 === Layers). Importing the live name.
// BriefcaseBusiness and CodeXml left with the section-header glyphs.
import { Layers, FileUser, UserRound, Mail, Linkedin } from "lucide-react"
import { MailMark, NewTabMark } from "@/components/ui/new-tab-mark"
import { projects } from "@/lib/projects"
import type { Project } from "@/lib/projects"
import { vibeProjects } from "@/lib/vibe-projects"

// The persistent left rail. It is the site's index: every project is a row,
// and clicking one streams that project's reveal into the chat. It replaces
// the old scrolling project grid entirely — see the note in app/page.tsx.
//
// Project rows open a conversation; CASE STUDY, RESUME and ABOUT open
// documents. The handoff distinguished the two with a right-aligned mono meta
// ("DECK · 21 SLIDES", "PDF"); those have been removed. What separates them now
// is that a document row carries a line icon where a project row carries a
// screenshot, and that the group sits below a hairline rather than below a gap
// — the gap alone measured 39px against a 43px section boundary, which is to
// say it wasn't a distinction at all.
//
// A row is `client` over `railSubtitle`, mirroring the chat's project-header
// card. Three projects share the client "Complex NTWRK", so the top line
// repeats on three rows; `railSubtitle` is what tells them apart (Live
// Selling / E-commerce / Product Management). `projectTitle` is deliberately
// NOT shown here — it stays the project's name in the chat card and in
// edwin-context.md, and is too long for a 198px column.

export type Pane = "chat" | "deck" | "about" | "resume"

// The document glyphs' stroke. Lucide expresses stroke-width in viewBox units,
// so the painted weight moves with the rendered size: at the old 32px this 1.25
// landed at 1.67 device px, and at today's 24px glyph it paints 1.25.
//
// ITS ORIGINAL REASON IS GONE. It was picked to sit level with the 16px
// section-header marks above it, and those marks have been deleted — there is
// nothing left in the rail to weigh it against. It is kept at 1.25 because the
// glyph also went primary in the same change, and a heavier stroke on top of a
// lighter colour would have moved two variables at once. Worth re-picking by
// eye against the rail as it now stands.
const DOC_ICON_STROKE = 1.25

interface SidebarProps {
  activeSlug: string | null
  activePane: Pane
  onProjectSelect: (slug: string) => void
  onSelectAbout: () => void
  onSelectDeck: () => void
  onSelectResume: () => void
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
      {/* .type-section, not .type-label: mono caps at the body step. A region
          heading and a row label were the same size, which is what made the
          document rows read as headers in the first place. */}
      <p
        className="type-section rail-section"
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
  onSelectResume,
  onHome,
  onNavigate,
  open = false,
}: SidebarProps) {
  const pick = (fn: () => void) => () => {
    fn()
    onNavigate?.()
  }

  // Is there anything below the fold? A clipped rail is otherwise silent —
  // About spent three rounds under the edge with nothing on screen saying so.
  // Measured rather than assumed: the answer changes with the viewport, with
  // the dev-only VIBE CODING section, and with every row added later.
  const scrollRef = useRef<HTMLElement | null>(null)
  const [more, setMore] = useState(false)
  const measure = () => {
    const el = scrollRef.current
    if (!el) return
    setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    measure()
    // ResizeObserver on BOTH boxes: the viewport changing resizes the
    // scroller, and a row appearing resizes its content. Watching one misses
    // the other, and the fade then lies in whichever direction was missed.
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <aside className="rail" data-open={open} aria-label="Site index">
      {/* "Edwin Lara" at every width — one form, replacing both the rail's
          "Edwin Socrates Lara" and the top bar's "Edwin". The full name still
          stands on the résumé, the case-study header and the page title: it
          has left the app chrome, not the site. */}
      {/* THREE TARGETS ON ONE ROW, AND THEY ARE SIBLINGS. The obvious way to
          write this — the links inside the brand button — is invalid HTML
          (interactive content cannot nest) and behaves exactly as badly as it
          reads: a click on the mail icon would fire the link AND bubble to the
          button, sending you home from a control that meant to open mail.
          Siblings in a flex row have no such relationship. The home control's
          hit area ends where its own box ends, the two links own theirs, and
          nothing overlaps: each is a real 44px box rather than a small glyph
          with an invisible area painted around it, so there is no way for two
          targets to claim the same pixel. */}
      <div className="rail-head">
        <button type="button" className="rail-brand" onClick={pick(onHome)}>
          <Sparkle size="var(--brand-mark-size)" />
          <span className="type-badge" style={{ color: "rgb(var(--bureau-text-primary))" }}>
            Edwin Lara
          </span>
        </button>
        {/* The visible labels are gone, so the accessible name is now the ONLY
            name. Each link carries its own sr-only noun before the mark's
            announcement — "Email (opens your email app)" and "LinkedIn (opens
            in a new tab)" — because an icon with only a suffix would announce
            as "(opens your email app)" and name nothing. */}
        <div className="rail-contact">
          <a
            className="rail-contact-link"
            href={`mailto:${CONTACT_EMAIL}`}
            style={{ color: "rgb(var(--bureau-text-secondary))" }}
          >
            <Mail className="rail-contact-icon" aria-hidden="true" strokeWidth={2} />
            <span className="sr-only">Email</span>
            {/* No arrow: the Mail glyph is already this control's mark, and two
                glyphs on one control read as two actions. The announcement
                stays either way. */}
            <MailMark glyph={false} />
          </a>
          <a
            className="rail-contact-link"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgb(var(--bureau-text-secondary))" }}
          >
            <Linkedin className="rail-contact-icon" aria-hidden="true" strokeWidth={2} />
            <span className="sr-only">LinkedIn</span>
            {/* This one KEEPS the arrow. It reassigns the window, and the rule
                is that a target="_blank" carries a visible mark as well as an
                announcement — the one case where a second glyph earns its
                place. */}
            <NewTabMark />
          </a>
        </div>
      </div>

      {/* The wrapper exists to carry the fade: a background painted on the
          scroller itself scrolls away with the list. */}
      <div className="rail-scroll-wrap" data-overflow={more}>
      <nav className="rail-scroll" ref={scrollRef} onScroll={measure} aria-label="Work and documents">
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
            {/* 1.25, not the 2 the 16px icons carry. A Lucide stroke is in
                viewBox units, so the same number on a 32px icon paints twice
                as thick — at 2 the document marks out-weighed the section
                header above them, which inverts the hierarchy. See
                DOC_ICON_STROKE. */}
            <Layers className="rail-icon" aria-hidden="true" strokeWidth={DOC_ICON_STROKE} />
            <span className="type-label rail-doc-label">Case Study</span>
          </button>

          {/* A button, not a link. This row opened DocHub in a new tab until
              the Resume pane existed; now it swaps the pane like CASE STUDY
              and ABOUT. NewTabMark came off with the href — it announced
              "opens in a new tab", which would now be a lie, and a stale
              announcement survives a redesign unnoticed. */}
          <button
            type="button"
            className="rail-doc"
            data-active={activePane === "resume"}
            aria-current={activePane === "resume" ? "true" : undefined}
            onClick={pick(onSelectResume)}
          >
            <FileUser className="rail-icon" aria-hidden="true" strokeWidth={DOC_ICON_STROKE} />
            <span className="type-label rail-doc-label">Resume</span>
          </button>

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
            <UserRound className="rail-icon" aria-hidden="true" strokeWidth={DOC_ICON_STROKE} />
            <span className="type-label rail-doc-label">About</span>
          </button>
        </div>
      </nav>
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
