"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "default" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

export function Spinner({ size = "default", className }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
    />
  )
}

interface SpinProps {
  spinning?: boolean
  children?: React.ReactNode
  size?: "sm" | "default" | "lg"
  tip?: string
  className?: string
}

export function Spin({
  spinning = true,
  children,
  size = "default",
  tip,
  className,
}: SpinProps) {
  if (!spinning && children) {
    return <>{children}</>
  }

  if (children) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "transition-opacity",
            spinning && "opacity-50 pointer-events-none"
          )}
        >
          {children}
        </div>
        {spinning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50">
            <Spinner size={size} />
            {tip && (
              <span className="mt-2 text-sm text-muted-foreground">{tip}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Spinner size={size} />
      {tip && (
        <span className="mt-2 text-sm text-muted-foreground">{tip}</span>
      )}
    </div>
  )
}
