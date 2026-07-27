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
        gap: "var(--space-between)",
        border: "1px solid rgb(var(--bureau-border))",
        borderRadius: "var(--bureau-radius-card)",
        background: "rgb(var(--bureau-surface))",
        padding: "var(--space-between)",
        textDecoration: "none",
      }}
    >
      <span
        className="type-badge"
        style={{
          // Widened from 40x34: the glyph moved 8px -> 12px and "VIDEO"
          // no longer fits 40px. 34 was also off the 4px grid.
          width: "var(--space-48)",
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
        {glyph}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          className="type-card-h3"
          style={{
            display: "block",
            color: "rgb(var(--bureau-text-primary))",
          }}
        >
          {label}
        </span>
        <span
          className="type-meta"
          style={{
            display: "block",
            color: "rgb(var(--bureau-text-muted))",
            // Optical: title-to-meta gap, tighter than `within` because the
            // meta line's own leading already separates them. Documented
            // exception.
            marginTop: 5,
          }}
        >
          {meta}
        </span>
      </span>
      <span className="type-label" style={{ color: "rgb(var(--bureau-text-primary))" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-within)", maxWidth: 480 }}>
      {items.map((item) => (
        <ProofLinkItem key={item.glyph} {...item} />
      ))}
    </div>
  )
}
