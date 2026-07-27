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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-between)" }}>
      <TextBubble text={`**How it's built:** ${architecture}`} />
      {stack.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-within)" }}>
          {stack.map((tech) => (
            <span
              key={tech}
              className="type-label"
              style={{
                // Asymmetric on purpose — uppercase mono with positive
                // tracking leaves a trailing letter-space that needs
                // optical compensation on the right. Documented exception.
                padding: "var(--space-4) var(--space-8)",
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
