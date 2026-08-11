"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { PromptChip } from "@/components/chat/prompt-chip"
import { DOCS, type DocKey } from "@/lib/constants"
import type { ProofLinks as ProofLinksData } from "@/lib/projects"
import { CONTENT_WIDTH } from "@/lib/layout"
import { ArchitectureSection } from "@/components/case-study/architecture-section"
import { ProofLinks } from "@/components/case-study/proof-links"
import { ImageLightbox } from "@/components/chat/image-lightbox"
import { SlideGrid } from "@/components/case-study/slide-grid"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import type { MessageBlock } from "@/hooks/use-scripted-stream"

// Message types
export type MessageKind =
  | "text"
  | "section-heading"
  | "project-header"
  | "image"
  | "image-row"
  | "slide-grid"
  | "impact"
  | "followups"
  | "doc-link"
  | "architecture"
  | "proof-links"

export interface BaseMessage {
  id: string
  role: "user" | "assistant"
  kind?: MessageKind
}

export interface TextMessage extends BaseMessage {
  kind: "text"
  text: string
}

export interface SectionHeadingMessage extends BaseMessage {
  kind: "section-heading"
  text: string
}

export interface ProjectHeaderMessage extends BaseMessage {
  kind: "project-header"
  project: {
    slug: string
    client: string
    projectTitle: string
    role: string
    year?: string
    previewImage: string
  }
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

export interface ImageRowMessage extends BaseMessage {
  kind: "image-row"
  images: { url: string; alt?: string }[]
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

export interface FollowupsMessage extends BaseMessage {
  kind: "followups"
  text?: string
  chips: { text: string; slug?: string }[]
}

export interface DocLinkMessage extends BaseMessage {
  kind: "doc-link"
  docKey: DocKey
}

export interface ArchitectureMessage extends BaseMessage {
  kind: "architecture"
  architecture: string
  stack: string[]
}

export interface ProofLinksMessage extends BaseMessage {
  kind: "proof-links"
  links: ProofLinksData
}

export type StructuredMessage =
  | TextMessage
  | SectionHeadingMessage
  | ProjectHeaderMessage
  | ImageMessage
  | ImageRowMessage
  | SlideGridMessage
  | ImpactMessage
  | FollowupsMessage
  | DocLinkMessage
  | ArchitectureMessage
  | ProofLinksMessage

// Text bubble with markdown-like formatting
export function TextBubble({ text }: { text: string }) {
  if (!text) return null

  return (
    <div className="type-body" style={{ color: "rgb(var(--bureau-text-primary))" }}>
      {text.split("\n").map((p, i) => (
        <p
          key={i}
          style={{ margin: i === 0 ? 0 : "var(--space-within) 0 0" }}
          dangerouslySetInnerHTML={{
            __html: p
              .replace(
                /\*\*(.+?)\*\*/g,
                '<strong style="font-weight:700">$1</strong>'
              )
              .replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener" style="color:rgb(var(--bureau-text-primary));text-decoration:underline;text-underline-offset:3px">$1</a>'
              ),
          }}
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

// Project header card
export function ProjectHeaderBubble({
  project,
}: {
  project: ProjectHeaderMessage["project"]
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-between)",
        background: "rgb(var(--bureau-surface))",
        border: "1px solid rgb(var(--bureau-border))",
        padding: "var(--space-between)",
        maxWidth: 480,
        borderRadius: "var(--bureau-radius-card)",
      }}
    >
      <div
        style={{
          width: "var(--space-64)",
          height: "var(--space-64)",
          flexShrink: 0,
          background: "rgb(var(--bureau-elevated))",
          border: "1px solid rgb(var(--bureau-border))",
          borderRadius: "var(--bureau-radius-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Image
          src={project.previewImage}
          alt=""
          fill
          className="object-contain p-1"
          sizes="64px"
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          flex: 1,
          gap: "var(--space-4)",
        }}
      >
        <div
          className="type-label"
          style={{
            color: "rgb(var(--bureau-text-secondary))",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {project.client}
        </div>
        <div
          className="type-title"
          style={{ color: "rgb(var(--bureau-text-primary))" }}
        >
          {project.projectTitle}
        </div>
        <div className="type-caption" style={{ color: "rgb(var(--bureau-text-muted))" }}>
          {project.role}
          {project.year && (
            <>
              {" · "}
              <span className="font-mono">{project.year}</span>
            </>
          )}
        </div>
      </div>
    </div>
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
  border: "1px solid rgb(var(--bureau-border))",
  background: "rgb(var(--bureau-elevated))",
  borderRadius: "var(--bureau-radius-card)",
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
          style={{ filter: "grayscale(.15)" }}
          sizes={`${CONTENT_WIDTH}px`}
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

// Full-width, stacked column of images (was a side-by-side grid — each
// image now gets the full chat-column width instead of a ~1/3 thumbnail)
export function ImageRowBubble({
  images,
}: {
  images: { url: string; alt?: string }[]
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([])

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-between)" }}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            ref={(el) => {
              triggerRefs.current[i] = el
            }}
            onClick={() => setLightboxIndex(i)}
            aria-label={img.alt ? `Open image: ${img.alt}` : `Open image ${i + 1} of ${images.length}`}
            style={IMAGE_TRIGGER_STYLE}
          >
            <Image
              src={img.url}
              alt={img.alt || ""}
              fill
              className="object-cover"
              style={{ filter: "grayscale(.15)" }}
              sizes={`${CONTENT_WIDTH}px`}
            />
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => {
            const openedFrom = lightboxIndex
            setLightboxIndex(null)
            triggerRefs.current[openedFrom]?.focus()
          }}
        />
      )}
    </div>
  )
}

// Impact stats card
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
        background: "rgb(var(--bureau-surface))",
        border: "1px solid rgb(var(--bureau-border))",
        borderLeft: "2px solid rgb(var(--bureau-accent))",
        padding: "var(--space-20) var(--space-24)",
        maxWidth: 520,
        borderRadius: "var(--bureau-radius-card)",
      }}
    >
      <div
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
              className="type-nav"
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

// Document link card — square glyph + title + meta + download arrow
export function DocLinkBubble({ docKey }: { docKey: DocKey }) {
  const doc = DOCS[docKey]
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-between)",
        border: "1px solid rgb(var(--bureau-border))",
        borderRadius: "var(--bureau-radius-card)",
        background: "rgb(var(--bureau-surface))",
        padding: "var(--space-between)",
        maxWidth: 480,
        textDecoration: "none",
      }}
    >
      <span
        className="type-badge"
        style={{
          // 34 -> 32 to land on the grid; the glyph also grew 8px -> 12px.
          width: "var(--space-32)",
          height: "var(--space-32)",
          flexShrink: 0,
          border: "1px solid rgb(var(--bureau-border-strong))",
          borderRadius: "var(--bureau-radius-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgb(var(--bureau-text-secondary))",
        }}
      >
        PDF
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          className="type-card-h3"
          style={{
            display: "block",
            color: "rgb(var(--bureau-text-primary))",
          }}
        >
          {doc.label}
        </span>
        <span
          className="type-meta"
          style={{
            display: "block",
            color: "rgb(var(--bureau-text-muted))",
            // Optical title-to-meta gap. Documented exception.
            marginTop: 5,
          }}
        >
          PDF
        </span>
      </span>
      <span className="type-label" style={{ color: "rgb(var(--bureau-text-primary))" }}>
        ↓
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
              prefix="→"
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
export function TypingIndicator() {
  return (
    <div
      className="type-label"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-within)",
        color: "rgb(var(--bureau-text-muted))",
      }}
    >
        {[0, 200, 400].map((d) => (
          <span
            key={d}
            className="animate-bureau-pulse"
            style={{
              width: "var(--space-4)",
              height: "var(--space-4)",
              borderRadius: 9999,
              background: "rgb(var(--bureau-text-secondary))",
              animationDelay: `${d}ms`,
            }}
          />
        ))}
      <span style={{ marginLeft: "var(--space-4)" }}>Generating</span>
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
      {kind === "text" && <TextBubble text={(message as TextMessage).text} />}
      {kind === "section-heading" && (
        <SectionHeading text={(message as SectionHeadingMessage).text} />
      )}
      {kind === "project-header" && (
        <ProjectHeaderBubble
          project={(message as ProjectHeaderMessage).project}
        />
      )}
      {kind === "image" && (
        <ImageBubble
          image={(message as ImageMessage).image}
          group={(message as ImageMessage).group}
          groupIndex={(message as ImageMessage).groupIndex}
        />
      )}
      {kind === "image-row" && (
        <ImageRowBubble
          images={(message as ImageRowMessage).images}
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
      {kind === "doc-link" && (
        <DocLinkBubble docKey={(message as DocLinkMessage).docKey} />
      )}
      {kind === "architecture" && (
        <ArchitectureSection
          architecture={(message as ArchitectureMessage).architecture}
          stack={(message as ArchitectureMessage).stack}
        />
      )}
      {kind === "proof-links" && (
        <ProofLinks links={(message as ProofLinksMessage).links} />
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
          background: "rgb(var(--bureau-elevated))",
          border: "1px solid rgb(var(--bureau-border))",
          borderRadius: "var(--bureau-radius-btn)",
          color: "rgb(var(--bureau-text-primary))",
        }}
      >
        {content}
      </div>
    </div>
  )
}
