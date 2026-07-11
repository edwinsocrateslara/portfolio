import { TextBubble } from "@/components/chat/message-bubbles"

interface ArchitectureSectionProps {
  architecture: string
  stack: string[]
}

// "How it's built:" paragraph (same treatment as "The challenge:"/"Key
// decision:" in the traditional variant) plus a row of stack tag pills,
// styled like the tag pills on the landing project cards.
export function ArchitectureSection({ architecture, stack }: ArchitectureSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <TextBubble text={`**How it's built:** ${architecture}`} />
      {stack.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {stack.map((tech) => (
            <span
              key={tech}
              style={{
                padding: "4px 8px",
                fontFamily: "var(--ff-plex-mono)",
                fontWeight: 600,
                fontSize: "10px",
                lineHeight: "1",
                letterSpacing: "0.6px",
                color: "rgb(var(--bureau-text-muted))",
                border: "1px solid rgb(var(--bureau-border))",
                borderRadius: "var(--bureau-radius-chip)",
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
