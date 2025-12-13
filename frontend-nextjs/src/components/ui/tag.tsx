"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  closable?: boolean
  onClose?: () => void
  icon?: React.ReactNode
  color?: string
}

function Tag({
  className,
  variant,
  size,
  closable,
  onClose,
  icon,
  color,
  children,
  style,
  ...props
}: TagProps) {
  const customStyle = color
    ? {
        ...style,
        backgroundColor: color,
        borderColor: color,
        color: "#fff",
      }
    : style

  return (
    <span
      className={cn(tagVariants({ variant: color ? undefined : variant, size }), className)}
      style={customStyle}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {closable && (
        <button
          type="button"
          className="ml-1 rounded-full outline-none hover:bg-black/10 dark:hover:bg-white/10 focus:ring-2 focus:ring-ring"
          onClick={(e) => {
            e.stopPropagation()
            onClose?.()
          }}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </button>
      )}
    </span>
  )
}

export { Tag, tagVariants }
