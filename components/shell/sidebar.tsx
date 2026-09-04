"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Sparkle } from "@/components/ui/sparkle"
// Layers, not Layers3: Layers3 is a deprecated alias in v0.544 and resolves to
// the same component (verified: Layers3 === Layers). Importing the live name.
// BriefcaseBusiness and CodeXml left with the section-header glyphs.
import { Layers, FileText, UserRound, Mail, Linkedin } from "lucide-react"
import { ICON_STROKE_CONTROL, ICON_STROKE_RAIL } from "@/lib/icons"
import { MailMark, NewTabMark } from "@/components/ui/new-tab-mark"
// NO PROJECT IMPORT. The rail draws a thumbnail, a client name and a subtitle;
// importing lib/projects.ts to do that pulled every reveal's prose and alt text
// into the first load. The 6 fields it needs arrive as a prop, derived on the
// server — see lib/project-index.ts.
import type { ProjectIndexEntry } from "@/lib/project-index"

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


interface SidebarProps {
  /** WORK rows, in order. Derived on the server; see lib/project-index.ts. */
  work: ProjectIndexEntry[]
  /** VIBE CODING rows. Kept a separate list rather than a flag on the entries
   *  because the rail renders them as two sections with their own headings, and
   *  a partition here would be the rail re-deriving something the server
   *  already knows. */
  vibe: ProjectIndexEntry[]
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
  items: ProjectIndexEntry[]
  activePane: Pane
  activeSlug: string | null
  onSelect: (slug: string) => void
  pick: (fn: () => void) => () => void
}) {
  return (
    <>
      {/* .type-rail-section, not .type-action: caps at the BODY step, not
          the label step. A region heading and a row label were the same size,
          which is what made the document rows read as headers in the first
          place — that distinction survives the move to Archivo unchanged,
          because it was always about size rather than family. */}
      <p
        className="type-rail-section rail-section"
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
              // A STABLE HANDLE FOR THE OFFLINE SCRIPTS. check-geometry.mjs and
              // the artboard setups used to reach these rows by array position
              // — RAILS[1] for Meridian, RAILS[7] for the vibe project — so
              // reordering or inserting a project silently pointed a case named
              // "meridian-reveal" at something else and still went green.
              // Nothing here renders differently; the attribute exists so a
              // test can select by identity and then assert what it selected.
              data-project-slug={p.slug}
              data-active={active}
              aria-current={active ? "true" : undefined}
              onClick={pick(() => onSelect(p.slug))}
            >
              {/* Decorative: the row's accessible name is the title beside it,
                  so alt="" avoids announcing the same project twice.
                  40, not 32, and all three numbers matter: the thumbnails grew
                  with --rail-thumb-size and these did not follow, so next/image
                  kept serving a 32px file into a 40px box — soft at 1x and
                  visibly soft at 2x, on all eight rows. `sizes` is also what
                  stops the optimizer shipping the full 1200-2160px source. */}
              {p.previewImage.url ? (
                <Image
                  className="rail-thumb"
                  src={p.previewImage.url}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
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
                <span className="type-action rail-item-client">{p.client}</span>
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
  work,
  vibe,
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
      {/* THE MARK ALONE. The wordmark beside this was "Edwin Lara"; at 1440 the
          rail now carries the sparkle and nothing else, in the accent.

          THE NAME IS NOT GONE FROM THE APP — it stays in the mobile top bar,
          where the rail is behind a sheet and this button is not on screen. So
          the two are not the same control at two widths any more: the desktop
          rail is a mark, the phone's top bar is a mark and a name.

          THE ACCESSIBLE NAME IS NOT OPTIONAL AND CANNOT COME FROM THE CONTENT.
          It used to: the button was named by the visible "Edwin Lara", and
          Sparkle is aria-hidden at every call site. Removing the text would
          have left a button with NO accessible name — announced as "button",
          on the control that goes home. The aria-label carries it now, and it
          says the name and the destination because the mark alone says
          neither. */}
      <button
        type="button"
        className="rail-brand"
        onClick={pick(onHome)}
        aria-label="Edwin Lara — home"
        style={{ color: "rgb(var(--bureau-accent))" }}
      >
        <Sparkle size="var(--brand-mark-size)" />
      </button>

      {/* The wrapper exists to carry the fade: a background painted on the
          scroller itself scrolls away with the list. */}
      <div className="rail-scroll-wrap" data-overflow={more}>
      <nav className="rail-scroll" ref={scrollRef} onScroll={measure} aria-label="Work and documents">
        <ProjectSection
          heading="Work"
          items={work}
          activePane={activePane}
          activeSlug={activeSlug}
          onSelect={onProjectSelect}
          pick={pick}
        />

        {/* Rendered only when there is something under it — a section heading
            above nothing is worse than no section.
            
            THE LENGTH CHECK IS THE ONLY CONDITION NOW. It used to be paired
            with a NODE_ENV check whose job was letting the minifier fold this
            branch away in production, taking the "Vibe Coding" string literal
            with it — the length check alone could not do that, because
            vibeProjects is an imported binding the minifier cannot evaluate.
            The section is public now, so there is nothing to fold away, and
            what remains is the condition that was always the real one: render
            the heading only when there is something under it. */}
        {vibe.length > 0 && (
          <ProjectSection
            heading="Vibe Coding"
            items={vibe}
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
            data-pane="deck"
            data-active={activePane === "deck"}
            aria-current={activePane === "deck" ? "true" : undefined}
            onClick={pick(onSelectDeck)}
          >
            {/* 1.25, not the 2 the 16px icons carry. A Lucide stroke is in
                viewBox units, so the same number on a 32px icon paints twice
                as thick — at 2 the document marks out-weighed the section
                header above them, which inverts the hierarchy. See
                DOC_ICON_STROKE. */}
            <Layers className="rail-icon" aria-hidden="true" strokeWidth={ICON_STROKE_RAIL} />
            <span className="type-action rail-doc-label">Case Study</span>
          </button>

          {/* A button, not a link. This row opened DocHub in a new tab until
              the Resume pane existed; now it swaps the pane like CASE STUDY
              and ABOUT. NewTabMark came off with the href — it announced
              "opens in a new tab", which would now be a lie, and a stale
              announcement survives a redesign unnoticed. */}
          <button
            type="button"
            className="rail-doc"
            data-pane="resume"
            data-active={activePane === "resume"}
            aria-current={activePane === "resume" ? "true" : undefined}
            onClick={pick(onSelectResume)}
          >
            <FileText className="rail-icon" aria-hidden="true" strokeWidth={ICON_STROKE_RAIL} />
            <span className="type-action rail-doc-label">Resume</span>
          </button>

          {/* Last in the document group, and a pane swap rather than a route:
              About is not a deep-linkable artefact the way the deck is, and a
              real navigation remounts the shell and destroys every project
              thread. */}
          <button
            type="button"
            className="rail-doc"
            data-pane="about"
            data-active={activePane === "about"}
            aria-current={activePane === "about" ? "true" : undefined}
            onClick={pick(onSelectAbout)}
          >
            <UserRound className="rail-icon" aria-hidden="true" strokeWidth={ICON_STROKE_RAIL} />
            <span className="type-action rail-doc-label">About</span>
          </button>
        </div>
      </nav>
      </div>

      {/* PINNED, not scrolled: flex: none after the scroller keeps these two on
          screen whatever the list does, which is the whole point of a footer
          for contact. The links are the same 44px boxes they were in the head
          row — real boxes rather than invisible areas, so two of them side by
          side cannot both claim the same pixel. Their 8px inset puts each
          GLYPH's left edge on 22, the same --rail-inset every section heading,
          thumbnail and document glyph above them sits on. */}
      <div className="rail-footer">
        <a
          className="rail-contact-link"
          href={`mailto:${CONTACT_EMAIL}`}
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          <Mail className="rail-contact-icon" aria-hidden="true" strokeWidth={ICON_STROKE_CONTROL} />
          <span className="sr-only">Email</span>
          <MailMark glyph={false} />
        </a>
        <a
          className="rail-contact-link"
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          <Linkedin className="rail-contact-icon" aria-hidden="true" strokeWidth={ICON_STROKE_CONTROL} />
          <span className="sr-only">LinkedIn</span>
          {/* NO VISIBLE ARROW any more — but glyph={false} rather than dropping
              the mark altogether, because the ANNOUNCEMENT is not the part
              being removed. This is what that switch was built for: a link
              that carries its own mark, here the LinkedIn logo, still has to
              tell a screen reader it reassigns the window. */}
          <NewTabMark glyph={false} />
        </a>
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
