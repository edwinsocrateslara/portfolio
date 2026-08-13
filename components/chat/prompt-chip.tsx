"use client"

interface PromptChipProps {
  label: string
  onClick: () => void
  disabled?: boolean
  prefix?: string
}

// An action, so it takes the full-size chip: caption type at a 44px target.
// Caption, not label: both are 12/18, but label is mono, uppercase and tracked
// — system-chrome voice — and these are things a person would say. The
// hover state lives in .chip rather than in React state — it was three
// useState hooks across three components doing what one CSS rule does, and a
// hover that depends on a re-render is a hover that can miss.
export function PromptChip({ label, onClick, disabled = false, prefix }: PromptChipProps) {
  return (
    <button type="button" className="chip type-caption" onClick={onClick} disabled={disabled}>
      {prefix && <span className="type-meta chip-prefix">{prefix}</span>}
      {label}
    </button>
  )
}
