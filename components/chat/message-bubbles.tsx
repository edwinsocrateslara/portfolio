"use client"

import Image from "next/image"
import { PromptChip } from "@/components/chat/prompt-chip"
import { DOCS, type DocKey } from "@/lib/constants"

// Message types
export type MessageKind =
  | "text"
  | "project-header"
  | "image"
  | "image-row"
  | "impact"
  | "followups"
  | "doc-link"

export interface BaseMessage {
  id: string
  role: "user" | "assistant"
  kind?: MessageKind
  firstOfStreak?: boolean
}

export interface TextMessage extends BaseMessage {
  kind: "text"
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
  caption?: string
}

export interface ImageRowMessage extends BaseMessage {
  kind: "image-row"
  images: { url: string; alt?: string }[]
  caption?: string
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

export type StructuredMessage =
  | TextMessage
  | ProjectHeaderMessage
  | ImageMessage
  | ImageRowMessage
  | ImpactMessage
  | FollowupsMessage
  | DocLinkMessage

// Avatar shown beside assistant messages
function Avatar() {
  return (
    <span
      style={{
        width: 26,
        height: 26,
        flexShrink: 0,
        borderRadius: "var(--bureau-radius-chip)",
        background: "rgb(var(--bureau-elevated))",
        border: "1px solid rgb(var(--bureau-border))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--ff-plex-mono)", fontWeight: 700, fontSize: "11px",
        color: "rgb(var(--bureau-text-primary))",
      }}
    >
      E
    </span>
  )
}

// Text bubble with markdown-like formatting
export function TextBubble({ text }: { text: string }) {
  if (!text) return null

  return (
    <div style={{ fontFamily: "var(--ff-archivo)", fontWeight: 400, fontSize: "16px", lineHeight: "1.7", color: "rgb(var(--bureau-text-primary))" }}>
      {text.split("\n").map((p, i) => (
        <p
          key={i}
          style={{ margin: i === 0 ? 0 : "12px 0 0" }}
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
        gap: 16,
        background: "rgb(var(--bureau-surface))",
        border: "1px solid rgb(var(--bureau-border))",
        padding: 16,
        maxWidth: 480,
        borderRadius: "var(--bureau-radius-card)",
      }}
    >
      <div
        style={{
          width: 70,
          height: 70,
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
          sizes="70px"
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          flex: 1,
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "10px", lineHeight: "1",
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "rgb(var(--bureau-text-secondary))",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {project.client}
        </div>
        <div
          style={{
            fontFamily: "var(--ff-archivo)", fontWeight: 700, fontSize: "20px", lineHeight: "1.2",
            letterSpacing: "-0.4px",
            color: "rgb(var(--bureau-text-primary))",
          }}
        >
          {project.projectTitle}
        </div>
        <div style={{ fontFamily: "var(--ff-archivo)", fontWeight: 400, fontSize: "13px", lineHeight: "1", color: "rgb(var(--bureau-text-muted))" }}>
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

// Single image bubble
export function ImageBubble({
  image,
  caption,
}: {
  image: { url: string; alt?: string }
  caption?: string
}) {
  return (
    <figure style={{ margin: 0, maxWidth: 520 }}>
      <div
        style={{
          overflow: "hidden",
          aspectRatio: "4 / 3",
          position: "relative",
          border: "1px solid rgb(var(--bureau-border))",
          borderRadius: "var(--bureau-radius-card)",
          background: "rgb(var(--bureau-elevated))",
        }}
      >
        <Image
          src={image.url}
          alt={image.alt || ""}
          fill
          className="object-cover"
          style={{ filter: "grayscale(.15)" }}
          sizes="520px"
        />
      </div>
      {(caption || image.alt) && (
        <figcaption
          style={{
            margin: "8px 0 0",
            fontFamily: "var(--ff-plex-mono)", fontWeight: 400, fontSize: "11px", lineHeight: "1.4",
            letterSpacing: "0.4px",
            color: "rgb(var(--bureau-text-muted))",
          }}
        >
          {caption || image.alt}
        </figcaption>
      )}
    </figure>
  )
}

// Row of images
export function ImageRowBubble({
  images,
  caption,
}: {
  images: { url: string; alt?: string }[]
  caption?: string
}) {
  const cellSize = images.length === 1 ? "560px" : images.length === 2 ? "276px" : "180px"
  return (
    <figure style={{ margin: 0, maxWidth: 560 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${images.length}, 1fr)`,
          gap: 14,
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            style={{
              overflow: "hidden",
              aspectRatio: "4 / 3",
              position: "relative",
              border: "1px solid rgb(var(--bureau-border))",
              borderRadius: "var(--bureau-radius-card)",
              background: "rgb(var(--bureau-elevated))",
            }}
          >
            <Image
              src={img.url}
              alt={img.alt || ""}
              fill
              className="object-cover"
              style={{ filter: "grayscale(.15)" }}
              sizes={cellSize}
            />
          </div>
        ))}
      </div>
      {caption && (
        <figcaption
          style={{
            margin: "8px 0 0",
            fontFamily: "var(--ff-plex-mono)", fontWeight: 400, fontSize: "11px", lineHeight: "1.4",
            letterSpacing: "0.4px",
            color: "rgb(var(--bureau-text-muted))",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
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
        padding: "20px 22px",
        maxWidth: 520,
        borderRadius: "var(--bureau-radius-card)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "10px", lineHeight: "1",
          letterSpacing: "1.6px",
          textTransform: "uppercase",
          color: "rgb(var(--bureau-text-secondary))",
          marginBottom: 14,
        }}
      >
        <span style={{ display: "inline-block", width: 8, height: 8, background: "rgb(var(--bureau-accent))", flexShrink: 0 }} /> {label || "Impact"}
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {items.map((x, i) => (
          <li
            key={i}
            style={{
              fontFamily: "var(--ff-archivo)", fontWeight: 400, fontSize: "15px", lineHeight: "1.55",
              color: "rgb(var(--bureau-text-primary))",
              display: "flex",
              gap: 14,
              alignItems: "baseline",
            }}
          >
            <span
              className="font-mono"
              style={{
                flexShrink: 0,
                width: 20,
                fontFamily: "var(--ff-plex-mono)", fontWeight: 500, fontSize: "12px", lineHeight: "1.5",
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
        gap: 14,
        border: "1px solid rgb(var(--bureau-border))",
        borderRadius: "var(--bureau-radius-card)",
        background: "rgb(var(--bureau-surface))",
        padding: "14px 16px",
        maxWidth: 480,
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          border: "1px solid rgb(var(--bureau-border-strong))",
          borderRadius: "var(--bureau-radius-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--ff-plex-mono)", fontWeight: 700, fontSize: "8px", lineHeight: "1",
          letterSpacing: "0.5px",
          color: "rgb(var(--bureau-text-secondary))",
        }}
      >
        PDF
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--ff-archivo)", fontWeight: 600, fontSize: "14px", lineHeight: "1.2",
            color: "rgb(var(--bureau-text-primary))",
          }}
        >
          {doc.label}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "var(--ff-plex-mono)", fontWeight: 400, fontSize: "11px", lineHeight: "1",
            letterSpacing: "0.4px",
            color: "rgb(var(--bureau-text-muted))",
            marginTop: 5,
          }}
        >
          PDF
        </span>
      </span>
      <span style={{ fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "13px", lineHeight: "1", color: "rgb(var(--bureau-text-primary))" }}>
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
            marginTop: text ? 18 : 0,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
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

// Typing indicator
export function TypingIndicator({ showAvatar = true }: { showAvatar?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {showAvatar && <Avatar />}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "9px", lineHeight: "1",
          letterSpacing: "1.6px",
          textTransform: "uppercase",
          color: "rgb(var(--bureau-text-muted))",
        }}
      >
        {[0, 200, 400].map((d) => (
          <span
            key={d}
            className="animate-bureau-pulse"
            style={{
              width: 5,
              height: 5,
              borderRadius: 9999,
              background: "rgb(var(--bureau-text-secondary))",
              animationDelay: `${d}ms`,
            }}
          />
        ))}
        <span style={{ marginLeft: 4 }}>Generating</span>
      </div>
    </div>
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
  const showAvatar = message.firstOfStreak !== false
  const kind = message.kind || "text"

  return (
    <div
      className="animate-slide-up"
      style={{ display: "flex", gap: 14 }}
    >
      {showAvatar ? <Avatar /> : <span style={{ width: 26, flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {kind === "text" && <TextBubble text={(message as TextMessage).text} />}
        {kind === "project-header" && (
          <ProjectHeaderBubble
            project={(message as ProjectHeaderMessage).project}
          />
        )}
        {kind === "image" && (
          <ImageBubble
            image={(message as ImageMessage).image}
            caption={(message as ImageMessage).caption}
          />
        )}
        {kind === "image-row" && (
          <ImageRowBubble
            images={(message as ImageRowMessage).images}
            caption={(message as ImageRowMessage).caption}
          />
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
        {kind === "followups" && (
          <FollowupsBubble
            text={(message as FollowupsMessage).text}
            chips={(message as FollowupsMessage).chips}
            onPick={onChipPick}
            disabled={!isLastAssistant}
          />
        )}
      </div>
    </div>
  )
}

// User message bubble
export function UserBubble({ content }: { content: string }) {
  return (
    <div
      className="animate-slide-up"
      style={{ display: "flex", justifyContent: "flex-end" }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "12px 16px",
          background: "rgb(var(--bureau-elevated))",
          border: "1px solid rgb(var(--bureau-border))",
          borderRadius: "var(--bureau-radius-btn)",
          fontFamily: "var(--ff-archivo)", fontWeight: 400, fontSize: "15px", lineHeight: "1.5",
          color: "rgb(var(--bureau-text-primary))",
        }}
      >
        {content}
      </div>
    </div>
  )
}
