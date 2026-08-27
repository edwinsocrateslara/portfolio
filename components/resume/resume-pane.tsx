"use client"

import { ResumeTerminal } from "@/components/lab/resume-terminal"
import { Shimmer } from "@/components/lab/shimmer"
import { Fragment, useEffect, useRef } from "react"
import { Download } from "lucide-react"
import { DOCS } from "@/lib/constants"
import type { Resume, ResumeRole } from "@/lib/resume"

// The résumé as pane content. Everything here is PARSED, never retyped — the
// data arrives as a prop from a server component that reads
// lib/sources/resume.txt at build time. See the note at the top of
// lib/resume.ts for why it cannot be imported directly here.
//
// The arrangement is "Lede", chosen from five full-page boards: tools above
// experience in two columns, then one spine carrying experience and education.
// The argument it makes is that a hiring reader scans for stack before they
// will read prose, so the stack answers first and the roles carry the
// evidence. The cost is stated rather than hidden: 55 terms stand between the
// top of the pane and the first employer name.
//
// Deliberately absent: the contact block and the professional summary. Contact
// is in the rail footer two hundred pixels away, and a third copy on this page
// would be the third on screen. The summary is marketing register — the roles
// carry the evidence, and Edwin's call was that it reads as written by someone
// else.

// One row resolves every 90ms. The entrance itself is CSS (see
// .resume-row-line / -node / -body); this is only the cadence between rows,
// which has to be JS because it schedules the attribute flips. Its one home is
// here — nothing in the stylesheet knows about it.
const ROW_STAGGER_MS = 90

/** How far up the scroller the arrival line sits, as a fraction of its height
 *  measured from the bottom: 0.15 puts the line at 85%. A row resolves when
 *  its top crosses this, so the entrance happens under the reader's eye rather
 *  than at the very edge of the pane. */
const ARRIVAL_FRACTION = 0.15

/** "Oct 2025 – Present" as two lines. The source keeps a date RANGE, which is
 *  the honest shape for a résumé; the spine wants its ends stacked. Splitting
 *  on the en dash is derivation, not authoring — a range with no dash falls
 *  through as a single line rather than guessing at an end date. */
function dateEnds(dates: string): [string, string | null] {
  const parts = dates.split("–").map((p) => p.trim())
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : [dates, null]
}

/** A slash between two names of one thing is a joiner, not a break. Browsers
 *  disagree — UAX-14 allows a line break after "/" — which is what put
 *  "Supabase" and "/ PostgreSQL" on two lines in the tools list. Non-breaking
 *  spaces on both sides remove the opportunity: a break before GL is
 *  prohibited, so the run becomes unbreakable. NBSP rather than a word joiner
 *  because it is a real, visible-width character that survives copy-paste as
 *  the space it looks like.
 *
 *  Written as an escape, not as a literal NBSP: an invisible character in
 *  source is one nobody can see to keep. Same for the interpunct separator
 *  below, whose leading space is an NBSP for the mirror-image reason — it
 *  binds the dot to the item BEFORE it, so a wrapped line starts with a term
 *  rather than with a dangling separator. */
const joinSlashes = (item: string) => item.replace(/ \/ /g, "\u00A0/\u00A0")

function RoleBody({ role }: { role: ResumeRole }) {
  return (
    <>
      <p className="type-name resume-employer">{role.employer}</p>
      <p className="type-attribute resume-role-title">{role.title}</p>
      {role.groups.map((group, gi) => (
        <div key={group.label ?? gi} className="resume-group">
          {/* Only the contracting block has labels — three clients inside one
              engagement. DATA VOICE, and at the ATTRIBUTE weight: a client
              group is a category describing the engagement above it, the same
              kind of thing as the role line and the dates. 500 rather than 400
              is what separates it from the inventory it sits near. */}
          {group.label && <p className="type-attribute resume-group-label">{group.label}</p>}
          <ul className="resume-bullets">
            {group.bullets.map((bullet) => (
              <li key={bullet} className="type-body resume-bullet">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

export function ResumePane({ resume }: { resume: Resume }) {
  const rootRef = useRef<HTMLDivElement>(null)

  // ── The timeline entrance ──────────────────────────────────────────────
  // Rows resolve as their top crosses 85% of the scroller, one at a time in
  // document order, across BOTH spines — experience and education share one
  // queue, so the cadence never restarts at a section boundary.
  //
  // A SCROLL HANDLER, NOT AN IntersectionObserver, and that is a correction
  // rather than a preference. The observer version was written first, with
  // rootMargin "0px 0px -15% 0px", and driving it produced two failures:
  //
  //   Rows were SKIPPED on a jump. IO fires on a change of intersection
  //   state, and a row that goes from below the line to entirely above the
  //   scroller in one frame was never intersecting either side of the move —
  //   no state change, no callback, and the row stayed invisible for the rest
  //   of the visit. Measured: scrollTop 0 → 1500 left Complex NTWRK and
  //   Super.com permanently hidden.
  //
  //   The LAST ROW COULD NEVER ARRIVE. 85% of the scroller is a line the
  //   bottom of the document cannot reach: at maximum scroll the final
  //   education row sat 888px down an 1000px scroller, 38px short of a line it
  //   had no further scroll left to cross. Guaranteed, not a race.
  //
  // Asking the geometry directly has neither failure. A row has arrived when
  // its top is above the line OR it is fully inside the scroller — the second
  // clause is what lets the last row land. Arrivals are always a prefix of
  // what is left, because the rows are stacked, so shifting off the front of
  // `pending` IS document order and no sort is needed.
  //
  // The reduced-motion check is a SYNCHRONOUS read of the media query, not the
  // usePrefersReducedMotion hook. That hook starts false to match SSR and
  // corrects after mount, so gating on it would attach a listener and then
  // remove it — which is not the same thing as never listening. Here the
  // effect returns before anything is attached.
  //
  // Nothing arms the animation from JS. The at-rest → hidden switch lives
  // inside @media (prefers-reduced-motion: no-preference) keyed on
  // data-resolved, so under reduced motion the rows are simply never hidden,
  // and there is no frame where they paint at rest and then jump away.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // The pane scrolls, not the window.
    const scroller = root.closest<HTMLElement>(".pane-scroll")
    if (!scroller) return

    const pending = Array.from(root.querySelectorAll<HTMLElement>(".resume-row"))
    const queue: HTMLElement[] = []
    let timer: number | undefined
    let frame = 0

    const drain = () => {
      timer = undefined
      const next = queue.shift()
      if (!next) return
      next.dataset.resolved = "true"
      if (queue.length) timer = window.setTimeout(drain, ROW_STAGGER_MS)
    }

    const sweep = () => {
      frame = 0
      const box = scroller.getBoundingClientRect()
      const line = box.bottom - box.height * ARRIVAL_FRACTION
      while (pending.length) {
        const row = pending[0].getBoundingClientRect()
        if (row.top > line && row.bottom > box.bottom) break
        queue.push(pending.shift()!)
      }
      if (queue.length && timer === undefined) drain()
      // Nothing left to watch for. The handler takes itself off rather than
      // running for the rest of the session over a list it can never shorten.
      if (!pending.length) detach()
    }

    // One sweep per frame however many scroll events arrive. getBoundingClientRect
    // forces layout, so nine of them on every wheel tick is the one thing this
    // could plausibly cost.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sweep)
    }

    const detach = () => {
      scroller.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }

    scroller.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    sweep()

    return () => {
      detach()
      if (frame) cancelAnimationFrame(frame)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="resume" ref={rootRef}>
      <div className="deck-head">
        <h1 className="type-page pane-title">Resume</h1>
        {/* Same control as the deck's, and the same reasoning: .chip is the
            system's pill, so a second inline one would be a second place for
            the border, fill and hover to drift.
            `download`, no target — it says "Download PDF" and now does that. */}
        <a className="chip type-action deck-download" href={DOCS["resume"].url} download>
          <Download className="chip-icon" aria-hidden="true" strokeWidth={2} />
          Download PDF
          {/* LAB — the shimmer on a download pill. Two here, seven on the
              front door. Inert unless html[data-lab-shimmer]. */}
          <Shimmer />
        </a>
      </div>

      <p className="type-label pane-meta">Toronto, Canada</p>

      <hr className="resume-rule" />

      <section className="resume-section">
        {/* LAB — the résumé as shell output, above the record it describes.
            Inert unless html[data-lab-terminal]. */}
        <ResumeTerminal resume={resume} />
        <h2 className="type-section resume-heading">Tools</h2>
        {/* Six labelled bands in source order, two columns, set in type. Not
            logos: fifty-five brand marks would be the only uncontrolled colour
            on the site, and check-design rule 6 exists to stop exactly that.
            Not chips either — a chip is a control and none of these is
            clickable.

            DATA VOICE — .type-value, mono 12/18 at weight 400. A technical
            inventory is the
            interface reporting, not speaking, so these are mono by the rule.
            They were Archivo 16/24 and were the last thing on the site sitting
            on the wrong side of it.

            The label above each band is .type-label, also mono 12/18. Four
            things separate a label from its contents and none of them is size:
            CASE (caps against sentence case), weight (600 against 400),
            tracking (1.2px against none) and colour (muted against primary).
            Case is the one doing most of the work, which is the vibe reveal's
            STACK block's arrangement rather than the résumé dates' — those are
            both sentence case and lean on colour alone.
            The bands and their labels are PARSED. This component does not know
            what any of them are called, so a seventh band is a resume.txt edit
            and nothing else. */}
        <div className="resume-bands">
          {resume.skills.map((band) => (
            <div key={band.label} className="resume-band">
              <p className="type-label resume-band-label">{band.label}</p>
              <p className="type-value resume-band-items">
                {band.items.map((item, i) => (
                  <Fragment key={item}>
                    {i > 0 && <span className="resume-band-sep">{"\u00A0\u00B7 "}</span>}
                    {joinSlashes(item)}
                  </Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="resume-rule" />

      <section className="resume-section">
        <h2 className="type-section resume-heading">Experience</h2>
        <div className="resume-spine">
          {resume.roles.map((role) => {
            const [start, end] = dateEnds(role.dates)
            return (
              <article
                key={`${role.employer}-${role.dates}`}
                className="resume-row"
                data-resolved="false"
              >
                {/* A résumé is scanned by date and employer before it is read,
                    so the dates take their own column rather than opening the
                    paragraph. Start in primary, end muted: the pair reads as
                    one fact with a beginning that matters more than its end. */}
                <div className="resume-row-dates">
                  <p className="type-attribute resume-date-start">{start}</p>
                  {end && <p className="type-attribute resume-date-end">{end}</p>}
                </div>
                <div className="resume-row-rail" aria-hidden="true">
                  <span className="resume-row-line" />
                  <span className="resume-row-node" />
                </div>
                <div className="resume-row-body">
                  <RoleBody role={role} />
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="resume-section">
        <h2 className="type-section resume-heading">Education</h2>
        {/* Same spine, same columns, one difference: the node is a ring rather
            than a filled mark. A degree is not an event on the same axis as a
            job, and the source carries no dates for these — so the date column
            is empty here rather than filled with a year nobody wrote down. */}
        <div className="resume-spine">
          {resume.education.map((entry) => (
            <article key={entry.qualification} className="resume-row" data-resolved="false">
              <div className="resume-row-dates" />
              <div className="resume-row-rail" aria-hidden="true">
                <span className="resume-row-line" />
                <span className="resume-row-node" data-mark="open" />
              </div>
              <div className="resume-row-body">
                <p className="type-name resume-employer">{entry.qualification}</p>
                <p className="type-value resume-role-title">{entry.institution}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
