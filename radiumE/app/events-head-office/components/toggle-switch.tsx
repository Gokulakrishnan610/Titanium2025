"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function ToggleSwitch({
  defaultChecked = false,
  ariaLabel,
  onChange,
}: {
  defaultChecked?: boolean
  ariaLabel?: string
  onChange?: (checked: boolean) => void
}) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <button
      aria-label={ariaLabel}
      onClick={() => {
        setChecked((c) => {
          const next = !c
          onChange?.(next)
          return next
        })
      }}
      className={cn(
        "relative inline-flex h-6 w-11 rounded-full border border-border bg-surface transition-colors",
        checked ? "bg-accent/70" : "bg-muted/40",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 size-5 translate-x-0.5 rounded-full bg-foreground/80 transition-transform",
          checked && "translate-x-[22px]",
        )}
      />
    </button>
  )
}
