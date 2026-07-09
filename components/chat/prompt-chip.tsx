"use client"

interface PromptChipProps {
  label: string
  onClick: () => void
  disabled?: boolean
  prefix?: string
}

export function PromptChip({ label, onClick, disabled = false, prefix }: PromptChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        fontSize: 14,
        color: "#b4b4b4",
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 9999,
        transition: "all 0.15s",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#262626"
          e.currentTarget.style.borderColor = "#3a3a3a"
          e.currentTarget.style.color = "#ffffff"
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#1a1a1a"
        e.currentTarget.style.borderColor = "#2a2a2a"
        e.currentTarget.style.color = "#b4b4b4"
      }}
    >
      {prefix && (
        <span style={{ color: "rgb(var(--color-accent))", flexShrink: 0 }}>
          {prefix}
        </span>
      )}
      {label}
    </button>
  )
}
