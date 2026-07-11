import type { ProofLinks as ProofLinksData } from "@/lib/projects"

interface ProofLinkItemProps {
  glyph: string
  label: string
  meta: string
  href: string
}

// Mirrors the chat's DocLinkBubble treatment (square glyph + title + meta +
// arrow) but for arbitrary external links instead of a DOCS-keyed PDF.
function ProofLinkItem({ glyph, label, meta, href }: ProofLinkItemProps) {
  return (
    <a
      href={href}
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
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: 40,
          height: 34,
          flexShrink: 0,
          border: "1px solid rgb(var(--bureau-border-strong))",
          borderRadius: "var(--bureau-radius-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--ff-plex-mono)",
          fontWeight: 700,
          fontSize: "8px",
          lineHeight: "1",
          letterSpacing: "0.5px",
          color: "rgb(var(--bureau-text-secondary))",
        }}
      >
        {glyph}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--ff-archivo)",
            fontWeight: 600,
            fontSize: "14px",
            lineHeight: "1.2",
            color: "rgb(var(--bureau-text-primary))",
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "var(--ff-plex-mono)",
            fontWeight: 400,
            fontSize: "11px",
            lineHeight: "1",
            letterSpacing: "0.4px",
            color: "rgb(var(--bureau-text-muted))",
            marginTop: 5,
          }}
        >
          {meta}
        </span>
      </span>
      <span
        style={{
          fontFamily: "var(--ff-plex-mono)",
          fontWeight: 600,
          fontSize: "13px",
          lineHeight: "1",
          color: "rgb(var(--bureau-text-primary))",
        }}
      >
        ↗
      </span>
    </a>
  )
}

// Renders whichever of demo/repo/video exist; omits the rest.
export function ProofLinks({ links }: { links: ProofLinksData }) {
  const items: ProofLinkItemProps[] = []
  if (links.demo) {
    items.push({ glyph: "DEMO", label: "Live demo", meta: "External link", href: links.demo })
  }
  if (links.repo) {
    items.push({ glyph: "REPO", label: "Source code", meta: "GitHub", href: links.repo })
  }
  if (links.video) {
    items.push({ glyph: "VIDEO", label: "Walkthrough", meta: "Video", href: links.video })
  }

  if (items.length === 0) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      {items.map((item) => (
        <ProofLinkItem key={item.glyph} {...item} />
      ))}
    </div>
  )
}
