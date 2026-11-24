"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
// Layers, not Layers3: Layers3 is a deprecated alias in v0.544 and resolves to
// the same component (verified: Layers3 === Layers). Importing the live name.
// BriefcaseBusiness and CodeXml left with the section-header glyphs.
import { Layers, FileText, UserRound, Mail, Linkedin } from "lucide-react"
import { ICON_STROKE_CONTROL, ICON_STROKE_RAIL } from "@/lib/icons"
import { MailMark, NewTabMark } from "@/components/ui/new-tab-mark"
import { BrandMark } from "@/components/ui/brand-mark"
// NO PROJECT IMPORT. The rail draws a thumbnail, a client name and a subtitle;
// importing lib/projects.ts to do that pulled every reveal's prose and alt text
// into the first load. The 6 fields it needs arrive as a prop, derived on the
// server — see lib/project-index.ts.
import type { ProjectIndexEntry } from "@/lib/project-index"

// The persistent left rail. It is the site's index: every project is a row,
// and clicking one streams that project's reveal into the chat. It replaces
// the old scrolling project grid entirely.
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
  pick,
}: {
  heading: string
  items: ProjectIndexEntry[]
  activePane: Pane
  activeSlug: string | null
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
            // A REAL LINK to the project's thread, /work/<slug>, since 24
            // November — so a row can be opened in a new tab, shared, and
            // crawled. The shell opens the thread when the URL changes; this
            // only closes the mobile sheet. As a link it takes Enter and not
            // Space — standard for something that navigates. Pixel-identical
            // to the button it replaced: the front door was compared at
            // 1440x900, 1440x700 and 380x820, 0 pixels different.
            <Link
              key={p.slug}
              href={`/work/${p.slug}`}
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
              aria-current={active ? "page" : undefined}
              onClick={pick(() => {})}
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
            </Link>
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
      {/* THE MARK, at the thumbnails' 40, in primary ink — the same control
          and the same mark as the mobile top bar's, so the brand is one thing
          at both widths.

          It was the sparkle alone, in the accent, from 3 September; then the
          wordmark "Edwin" in Poppins 900 from 20 October; then this mark from
          21 October. The sparkle is the typing indicator only. NOT LIME,
          deliberately: lime means state on this site — active, focus, send,
          working — and a permanently lime identity mark reads as "on" all the
          time. DESIGN.md's accent inventory records it.

          NO VISIBLE TEXT, so the label carries the name: "Edwin Socrates Lara
          — home", the full name the page title uses and the destination. The
          mark is aria-hidden, as the sparkle was when it held this row. */}
      <button
        type="button"
        className="rail-brand"
        onClick={pick(onHome)}
        aria-label="Edwin Socrates Lara — home"
        style={{ color: "rgb(var(--bureau-text-primary))" }}
      >
        <BrandMark size="var(--brand-mark-size)" />
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
            pick={pick}
          />
        )}

        <div className="rail-docs">
          {/* REAL LINKS since 24 November: each document has its own URL —
              /case-study/meridian-deck, /resume, /about — so it can be shared,
              found, bookmarked and reached with back and forward. They used to
              be buttons that swapped the pane, because a route change would
              have remounted the shell and discarded every thread; the shell now
              lives in app/(site)/layout.tsx and a navigation keeps it.

              The pane follows the URL (PANE_FOR_PATH in app-shell.tsx), so
              there is no handler here to keep in step with it. onNavigate only
              closes the mobile sheet. data-pane stays: check:paint selects on
              it. */}
          <Link
            href="/case-study/meridian-deck"
            className="rail-doc"
            data-pane="deck"
            data-active={activePane === "deck"}
            aria-current={activePane === "deck" ? "page" : undefined}
            onClick={onNavigate}
          >
            {/* ICON_STROKE_RAIL, 1.5px of ink at 24 — the rule in
                lib/icons.ts. (This said "1.25… See DOC_ICON_STROKE"; that
                constant retired with the icon ramp on 28 August, 0de263b.) */}
            <Layers className="rail-icon" aria-hidden="true" strokeWidth={ICON_STROKE_RAIL} />
            <span className="type-action rail-doc-label">Case Study</span>
          </Link>

          {/* This row opened DocHub in a new tab until the Resume pane
              existed. NewTabMark came off with that href — it announced "opens
              in a new tab", which would now be a lie. */}
          <Link
            href="/resume"
            className="rail-doc"
            data-pane="resume"
            data-active={activePane === "resume"}
            aria-current={activePane === "resume" ? "page" : undefined}
            onClick={onNavigate}
          >
            <FileText className="rail-icon" aria-hidden="true" strokeWidth={ICON_STROKE_RAIL} />
            <span className="type-action rail-doc-label">Resume</span>
          </Link>

          <Link
            href="/about"
            className="rail-doc"
            data-pane="about"
            data-active={activePane === "about"}
            aria-current={activePane === "about" ? "page" : undefined}
            onClick={onNavigate}
          >
            <UserRound className="rail-icon" aria-hidden="true" strokeWidth={ICON_STROKE_RAIL} />
            <span className="type-action rail-doc-label">About</span>
          </Link>
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
