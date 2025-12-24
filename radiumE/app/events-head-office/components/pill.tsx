import type React from "react"
import { cn } from "@/lib/utils"

type PillProps = {
  icon?: React.ReactNode
  label: string
  trailing?: "chevron" | React.ReactNode
  className?: string
}

export function Pill({ icon, label, trailing = "chevron", className }: PillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 text-sm ring-1 ring-inset ring-border",
        className,
      )}
      role="button"
      aria-label={label}
      tabIndex={0}
    >
      {icon ? <span className="text-foreground/80">{icon}</span> : null}
      <span className="font-medium">{label}</span>
      {trailing === "chevron" ? (
        <svg
          viewBox="0 0 24 24"
          className="ml-0.5 size-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      ) : (
        trailing
      )}
    </div>
  )
}
