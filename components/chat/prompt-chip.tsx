"use client"

import { useState } from "react"

interface PromptChipProps {
  label: string
  onClick: () => void
  disabled?: boolean
  prefix?: string
}

export function PromptChip({ label, onClick, disabled = false, prefix }: PromptChipProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 16px",
        font: "500 13px var(--ff-archivo)",
        color: `rgb(var(--bureau-text-${hovered && !disabled ? "primary" : "secondary"}))`,
        background: `rgb(var(--bureau-${hovered && !disabled ? "elevated" : "surface"}))`,
        border: `1px solid rgb(var(--bureau-${hovered && !disabled ? "border-strong" : "border"}))`,
        borderRadius: "var(--bureau-radius-chip)",
        transition: "all 0.15s",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {prefix && (
        <span style={{ font: "400 13px var(--ff-plex-mono)", color: "rgb(var(--bureau-text-muted))", flexShrink: 0 }}>
          {prefix}
        </span>
      )}
      {label}
    </button>
  )
}
