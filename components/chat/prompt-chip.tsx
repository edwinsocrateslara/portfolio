"use client"

interface PromptChipProps {
  label: string
  onClick: () => void
  disabled?: boolean
  prefix?: string
}

// An action, so it takes the full-size chip: body type and room to hit. The
// hover state lives in .chip rather than in React state — it was three
// useState hooks across three components doing what one CSS rule does, and a
// hover that depends on a re-render is a hover that can miss.
export function PromptChip({ label, onClick, disabled = false, prefix }: PromptChipProps) {
  return (
    <button type="button" className="chip type-body" onClick={onClick} disabled={disabled}>
      {prefix && <span className="type-meta chip-prefix">{prefix}</span>}
      {label}
    </button>
  )
}
