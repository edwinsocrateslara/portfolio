"use client"

import Image from "next/image"
import { NewTabMark } from "@/components/ui/new-tab-mark"
import { Sparkle } from "@/components/ui/sparkle"
import { useRef, useState } from "react"
import { ArrowDownToLine } from "lucide-react"
import { PromptChip } from "@/components/chat/prompt-chip"
import { renderInline } from "@/lib/inline-markdown"
import { ICON_STROKE } from "@/lib/icons"
import { DOCS, type DocKey } from "@/lib/constants"
import { IMAGE_SIZES_MEASURE, CARD_WIDTH, CALLOUT_WIDTH } from "@/lib/layout"
import { ImageLightbox } from "@/components/chat/image-lightbox"
import { SlideGrid } from "@/components/case-study/slide-grid"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import type { MessageBlock } from "@/hooks/use-scripted-stream"

// Message types
export type MessageKind =
  | "text"
  | "section-heading"
  | "image"
  | "slide-grid"
  | "impact"
  | "spec"
  | "followups"
  | "doc-link"

export interface BaseMessage {
  id: string
  role: "user" | "assistant"
  kind?: MessageKind
}

export interface TextMessage extends BaseMessage {
  kind: "text"
  text: string
  /** The opening line of a project reveal. Renders one type step up so it
   *  reads as an opening statement rather than as the first of N identical
   *  paragraphs. Set by buildProjectBodyBlocks rather than by this renderer,
   *  so which line is the opening one is decided with the block order. */
  lede?: boolean
  /** Reference material rather than prose — a stack list, a cadence, counts.
   *  Renders in the mono DATA voice at the label step. A modifier on the
   *  text block, deliberately not a new kind: a second renderer would be a
   *  second place for the markdown handling and the link rules to drift. */
  mono?: boolean
}

export interface SectionHeadingMessage extends BaseMessage {
  kind: "section-heading"
  text: string
}


export interface ImageMessage extends BaseMessage {
  kind: "image"
  image: { url: string; alt?: string }
  // The project's full image set, so a single image placed on its own in
  // the reveal still opens a lightbox that can page through all of them.
  // Without this, splitting the images across the page would shrink each
  // lightbox to one item.
  group?: { url: string; alt?: string }[]
  groupIndex?: number
}


// A compact grid of deck slides. Full-width stacked images would be roughly
// 8,800px of scroll for a 21-slide deck.
export interface SlideGridMessage extends BaseMessage {
  kind: "slide-grid"
  slides: { url: string; alt: string }[]
}

export interface ImpactMessage extends BaseMessage {
  kind: "impact"
  label?: string
  items: string[]
}

/** The vibe reveal's spec table. Separate from ImpactMessage because the two
 *  are different claims: impacts are outcomes and keep the accent card; a spec
 *  is reference material and takes the table. Same `items` shape, so the
 *  source strings are unchanged. */
export interface SpecMessage extends BaseMessage {
  kind: "spec"
  items: string[]
}

export interface FollowupsMessage extends BaseMessage {
  kind: "followups"
  text?: string
  chips: { text: string; slug?: string }[]
}

export interface DocLinkMessage extends BaseMessage {
  kind: "doc-link"
  docKey: DocKey
}

export type StructuredMessage =
  | TextMessage
  | SectionHeadingMessage
  | ImageMessage
  | SlideGridMessage
  | ImpactMessage
  | SpecMessage
  | FollowupsMessage
  | DocLinkMessage

// Text bubble with markdown-like formatting
export function TextBubble({
  text,
  lede,
  mono,
}: {
  text: string
  lede?: boolean
  mono?: boolean
}) {
  if (!text) return null

  // .type-name, the same class the About page's opening sentence uses — one
  // step up in size AND weight, which separates it from the paragraphs below
  // on two axes. Weight alone at body size read as bold prose rather than as
  // an opening line. It stays well under .type-page (32/700), so the reveal
  // still reads as a conversation rather than as a page with a heading.
  return (
    <div
      className={mono ? "type-value" : lede ? "type-name lede-em" : "type-body"}
      style={{
        color: mono
          ? "rgb(var(--bureau-text-secondary))"
          : "rgb(var(--bureau-text-primary))",
      }}
    >
      {text.split("\n").map((p, i) => (
        <p
          key={i}
          style={{ margin: i === 0 ? 0 : "var(--space-within) 0 0" }}
          dangerouslySetInnerHTML={{ __html: renderInline(p) }}
        />
      ))}
    </div>
  )
}

// Section heading — the "KEY IMPACTS" / "MY ROLE" / "THE CHALLENGE" rules
// from the original Framer page. Mono eyebrow voice, matching the label on
// the impact card and the client eyebrows elsewhere. No new type token.
export function SectionHeading({ text }: { text: string }) {
  return (
    <h3
      className="type-label"
      style={{ margin: 0, color: "rgb(var(--bureau-text-secondary))" }}
    >
      {text}
    </h3>
  )
}


// Shared visual style for a clickable case-study image thumbnail —
// a real <button> (not a div) so it's keyboard-reachable and
// Enter/Space-activated by default.
const IMAGE_TRIGGER_STYLE = {
  display: "block",
  width: "100%",
  margin: 0,
  padding: 0,
  border: "1px solid var(--hairline)",
  background: "var(--layer-2)",
  borderRadius: "var(--bureau-radius-media)",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  aspectRatio: "16 / 9",
} as const

// Single image bubble
// `alt` is for assistive tech only. It used to double as a visible caption
// here via `caption || image.alt`, which printed every alt string under its
// own image — alt text describes an image to someone who cannot see it, so
// showing it to someone who can is redundant at best and reads as a leaked
// annotation at worst. There is no caption element any more; if real captions
// are ever wanted they are different copy and belong in lib/projects.ts.
export function ImageBubble({
  image,
  group,
  groupIndex,
}: {
  image: { url: string; alt?: string }
  group?: { url: string; alt?: string }[]
  groupIndex?: number
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setLightboxOpen(true)}
        aria-label={image.alt ? `Open image: ${image.alt}` : "Open image full-screen"}
        style={IMAGE_TRIGGER_STYLE}
      >
        <Image
          src={image.url}
          alt={image.alt || ""}
          fill
          className="object-cover"
          sizes={`${IMAGE_SIZES_MEASURE}px`}
        />
      </button>
      {lightboxOpen && (
        <ImageLightbox
          images={group && group.length > 0 ? group : [image]}
          initialIndex={group && group.length > 0 ? (groupIndex ?? 0) : 0}
          onClose={() => {
            setLightboxOpen(false)
            triggerRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}


// Impact stats card
/**
 * A SPEC TABLE — three columns, one rule per row.
 *
 * The vibe reveal's "Stack and numbers" block. It was six uniform rows of
 * `LABEL — sentence`, and it read as a wall because the six rows are not the
 * same shape: STACK and CADENCE are sentences, while CORPUS, OUTPUT, SHIPPED
 * and BUILT are figures with units. Eight figures — 457, ~300, 10, 66, 14, 14,
 * 34, 25 — were buried inside prose where nothing could find them.
 *
 * The leading figure is lifted into its own right-aligned column so the eye can
 * run down it. The words are untouched: `457 feedback items` is split into
 * `457` and `feedback items` at render time, and the source string in
 * lib/vibe-projects.ts still reads exactly as it always did.
 *
 * ROWS WITH NO FIGURE SPAN THE COLUMN rather than carrying an empty cell.
 * Five treatments were drawn — em dash, blank, middle dot, hairline tick, and
 * this — and the first four all read as a hole where a value should be. The
 * dash is the table convention for "not applicable" and it still draws the eye
 * to an absence; the tick reads as a redaction. A spanning cell has no empty
 * cell to explain. It also puts the two sentence rows on their own left edge,
 * which marks them as the other kind inside one uniform structure.
 */
export function SpecBubble({ items }: { items: string[] }) {
  // `**LABEL** — value`, the shape the source has always used.
  const rows = items.map((raw) => {
    const m = /^\*\*(.+?)\*\*\s*—\s*(.*)$/.exec(raw)
    const label = m ? m[1] : ""
    const value = m ? m[2] : raw
    // A leading figure is digits with an optional ~ and separators, followed by
    // a space. Anything else — a word, a name — is not a figure and the row
    // spans instead. Deliberately strict: "Next.js" must not become a figure.
    const f = /^(~?\d[\d,.]*)\s+(.*)$/.exec(value)
    return { label, figure: f ? f[1] : null, rest: f ? f[2] : value }
  })
  return (
    // borderTop on the wrapper rather than a 1px spacer div: the same hairline,
    // and it does not put a bare numeric length in a style object for rule 2
    // to find. Every row carries its own borderBottom, so this is only the
    // table's opening edge.
    <div style={{ maxWidth: "var(--prose-measure)", borderTop: "1px solid var(--hairline)" }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "var(--space-between)",
            padding: "var(--space-12) 0",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <div className="type-label" style={{ width: "var(--spec-label-col)", flex: "none", color: "rgb(var(--bureau-text-muted))" }}>
            {r.label}
          </div>
          {r.figure !== null && (
            // <strong>, not an inline fontWeight. Rule 1 forbids inline type
            // declarations and it is right to: a weight typed at a call site
            // is a weight nobody can find. The UA's bold is what the existing
            // STACK block already uses for its labels, so the figure and the
            // label it replaced get their emphasis the same way.
            <div
              className="type-value"
              style={{
                width: "var(--spec-figure-col)",
                flex: "none",
                textAlign: "right",
                color: "rgb(var(--bureau-text-primary))",
              }}
            >
              <strong>{r.figure}</strong>
            </div>
          )}
          <div className="type-value" style={{ flex: "1 1 0", minWidth: 0, color: "rgb(var(--bureau-text-secondary))" }}>
            {r.rest}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ImpactBubble({
  label,
  items,
}: {
  label?: string
  items: string[]
}) {
  return (
    <div
      style={{
        background: "var(--layer-1)",
        border: "1px solid var(--hairline)",
        borderLeft: "2px solid rgb(var(--bureau-accent))",
        padding: "var(--space-20) var(--space-24)",
        maxWidth: CALLOUT_WIDTH,
        borderRadius: "var(--bureau-radius-card)",
      }}
    >
      {/* type-label, like MY ROLE and THE CHALLENGE. It was the only section
          label in this surface without a type class, so it inherited Archivo
          while its siblings took the mono DATA voice — invisible until the
          font variables were fixed and the mono actually began rendering. */}
      <div
        className="type-label"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-within)",
          color: "rgb(var(--bureau-text-secondary))",
          marginBottom: "var(--space-between)",
        }}
      >
        <span style={{ display: "inline-block", width: "var(--space-8)", height: "var(--space-8)", background: "rgb(var(--bureau-accent))", flexShrink: 0 }} /> {label || "Impact"}
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-within)",
        }}
      >
        {items.map((x, i) => (
          <li
            key={i}
            className="type-body"
            style={{
              color: "rgb(var(--bureau-text-primary))",
              display: "flex",
              gap: "var(--space-between)",
              alignItems: "baseline",
            }}
          >
            <span
              className="type-label"
              style={{
                flexShrink: 0,
                width: "var(--space-20)",
                color: "rgb(var(--bureau-text-muted))",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Document link card, in two forms: a file this site serves, and a link out.
//
// DERIVED FROM THE URL, not declared on the entry. A same-origin href is a
// file in public/ — it downloads, it does not leave the site, and announcing a
// new tab for it would be false. Anything else is a destination. That is the
// actual difference between these two cards, so reading it off the URL is
// reading the fact rather than a description of it: a `kind` field would have
// to be kept in agreement with the URL by hand, and on the day the résumé
// moves from DocHub to /edwin-lara-resume-2026.pdf this changes verb on its
// own with no second edit to remember.
//
// One card is a link-out today. That is not a reason to special-case it at the
// call site — the rule costs one expression and describes all three.
export function DocLinkBubble({ docKey }: { docKey: DocKey }) {
  const doc = DOCS[docKey]
  const local = doc.url.startsWith("/")
  return (
    <a
      href={doc.url}
      // download on a same-origin file; target/rel only where the link really
      // does reassign the window.
      {...(local
        ? { download: true }
        : { target: "_blank", rel: "noopener noreferrer" })}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-between)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--bureau-radius-card)",
        background: "var(--layer-1)",
        padding: "var(--space-between)",
        maxWidth: CARD_WIDTH,
        textDecoration: "none",
      }}
    >
      {/* File-type chip, so only where there is a file type. A running
          deployment has none, and a PDF badge on one would be a lie in the
          most literal place on the card.

          .type-label, not the .type-badge it used to be. A file type IS a
          structural label — it says what kind of thing the link points at —
          and the class it had was mono 12 at weight 700, which would have been
          a FOURTH weight sharing the 12px rank alongside 400 values, 500
          attributes and 600 labels. The ceiling is three, and a fourth is
          defined as evidence the rank is overloaded rather than as a licence
          to add one. This is not an overloaded rank; it is a label. */}
      {local && (
        <span
          className="type-label"
          style={{
            // 34 -> 32 to land on the grid; the glyph also grew 8px -> 12px.
            width: "var(--space-32)",
            height: "var(--space-32)",
            flexShrink: 0,
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--bureau-radius-media)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgb(var(--bureau-text-secondary))",
          }}
        >
          PDF
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          className="type-body-strong"
          style={{
            display: "block",
            color: "rgb(var(--bureau-text-primary))",
          }}
        >
          {doc.label}
        </span>
        {/* The second line answers "what will I get?" — the file's format. A
            destination has none, and the question does not arise: the label is
            a verb, the arrow says where it goes, and a line under it was
            describing the link rather than telling anyone anything they were
            about to need. So the link-out is one line. */}
        {local && (
          <span
            className="type-attribute"
            style={{
              display: "block",
              color: "rgb(var(--bureau-text-muted))",
              marginTop: "var(--space-optical-meta)",
            }}
          >
            PDF
          </span>
        )}
      </span>
      <span className="type-label" style={{ color: "rgb(var(--bureau-text-primary))" }}>
        {local ? (
          <>
            {/* A REAL ICON, not the typed U+2193 this was. As a text character
                it inherited whatever font-size and weight its context set —
                here .type-label's 12/600 mono, rendering 8.4x15px — so it
                could not be sized or weighted with the other marks, and it
                sat at a font weight where they sit at a stroke. That is the
                same failure new-tab-mark.tsx documents for the typed arrow it
                replaced; this was the last one left.

                Same glyph as the download pills, which is the point: the site
                had two different download marks, a stroked icon on the pills
                and a character on this card. Not the same SIZE, and that is
                also the point — .doc-mark is 16 because this sits beside the
                card's 16px title, where the pill's .chip-icon is 12 because it
                sits inside a 12px label. Same rule, two neighbours.

                aria-hidden: the announcement beside it says what the control
                does, and it does NOT say "opens in a new tab" — a download
                reassigns nothing, and a false announcement is worse than
                none. Same reasoning as MailMark's. */}
            <ArrowDownToLine className="doc-mark" aria-hidden="true" strokeWidth={ICON_STROKE} />
            <span className="sr-only"> (downloads the file)</span>
          </>
        ) : (
          // WITH its glyph. The download arrow is gone from this branch, so
          // the "two arrows read as two actions" reason for suppressing it
          // has gone with it.
          <NewTabMark />
        )}
      </span>
    </a>
  )
}

// Follow-up suggestions
export function FollowupsBubble({
  text,
  chips,
  onPick,
  disabled,
}: {
  text?: string
  chips: { text: string; slug?: string }[]
  onPick?: (chip: { text: string; slug?: string }) => void
  disabled?: boolean
}) {
  return (
    <div>
      {text && <TextBubble text={text} />}
      {chips?.length > 0 && (
        <div
          style={{
            marginTop: text ? "var(--space-between)" : 0,
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-within)",
          }}
        >
          {chips.map((c, i) => (
            <PromptChip
              key={i}
              label={c.text}
              onClick={() => onPick?.(c)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Typing indicator — occupies the streaming slot on its own. There is no
// persistent avatar or reserved gutter: this appears while a message
// streams in and is unmounted once it has rendered, leaving no space
// behind.
// aria-hidden throughout. The announcement is not here — it lives in the
// shell's persistent live region, because a live region that mounts with its
// content already in place is unreliably announced, while one that already
// exists and whose content changes is announced consistently. Putting
// role="status" on this element would have looked right and worked
// intermittently.
//
// The geometry moved to components/ui/sparkle.tsx when the brand mark needed
// the same shape. One path, two sizes.
export function TypingIndicator() {
  return (
    <div
      aria-hidden="true"
      style={{ color: "rgb(var(--bureau-accent))" }}
    >
      <Sparkle size="var(--indicator-size)" />
    </div>
  )
}

// Renders one block's content. The single switch over message kinds —
// AssistantBubble wraps it for the chat stream, and the standalone
// case-study route renders blocks with it directly, so neither maintains
// its own copy of this mapping.
//
// Takes MessageBlock rather than StructuredMessage so callers holding a
// template (no id/role assigned yet) can render it; a StructuredMessage is
// assignable, having only extra fields.
export function MessageContent({
  message,
  onChipPick,
  isLastAssistant,
}: {
  message: MessageBlock
  onChipPick?: (chip: { text: string; slug?: string }) => void
  isLastAssistant?: boolean
}) {
  const kind = message.kind || "text"

  return (
    <>
      {kind === "text" && (
        <TextBubble
          text={(message as TextMessage).text}
          lede={(message as TextMessage).lede}
          mono={(message as TextMessage).mono}
        />
      )}
      {kind === "section-heading" && (
        <SectionHeading text={(message as SectionHeadingMessage).text} />
      )}
      {kind === "image" && (
        <ImageBubble
          image={(message as ImageMessage).image}
          group={(message as ImageMessage).group}
          groupIndex={(message as ImageMessage).groupIndex}
        />
      )}
      {kind === "slide-grid" && (
        <SlideGrid slides={(message as SlideGridMessage).slides} columns={4} />
      )}
      {kind === "impact" && (
        <ImpactBubble
          label={(message as ImpactMessage).label}
          items={(message as ImpactMessage).items}
        />
      )}
      {kind === "spec" && (
        <SpecBubble items={(message as StructuredMessage & { items: string[] }).items} />
      )}

      {kind === "doc-link" && (
        <DocLinkBubble docKey={(message as DocLinkMessage).docKey} />
      )}
      {kind === "followups" && (
        <FollowupsBubble
          text={(message as FollowupsMessage).text}
          chips={(message as FollowupsMessage).chips}
          onPick={onChipPick}
          disabled={!isLastAssistant}
        />
      )}
    </>
  )
}

// Assistant message wrapper
export function AssistantBubble({
  message,
  onChipPick,
  isLastAssistant,
}: {
  message: StructuredMessage
  onChipPick?: (chip: { text: string; slug?: string }) => void
  isLastAssistant?: boolean
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div
      className={prefersReducedMotion ? undefined : "animate-slide-up"}
      style={{ minWidth: 0 }}
    >
      <div style={{ minWidth: 0 }}>
        <MessageContent
          message={message}
          onChipPick={onChipPick}
          isLastAssistant={isLastAssistant}
        />
      </div>
    </div>
  )
}

// User message bubble
export function UserBubble({ content }: { content: string }) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div
      className={prefersReducedMotion ? undefined : "animate-slide-up"}
      style={{ display: "flex", justifyContent: "flex-end" }}
    >
      <div
        className="type-body"
        style={{
          maxWidth: "70%",
          padding: "var(--space-within) var(--space-between)",
          background: "var(--layer-2)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--bureau-radius-btn)",
          color: "rgb(var(--bureau-text-primary))",
        }}
      >
        {content}
      </div>
    </div>
  )
}
