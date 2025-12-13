"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const floatButtonVariants = cva(
  "fixed rounded-full shadow-lg transition-all hover:scale-105 active:scale-95",
  {
    variants: {
      position: {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "top-right": "top-6 right-6",
        "top-left": "top-6 left-6",
        "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
      },
      size: {
        default: "h-12 w-12",
        sm: "h-10 w-10",
        lg: "h-14 w-14",
      },
    },
    defaultVariants: {
      position: "bottom-right",
      size: "default",
    },
  }
)

export interface FloatButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof floatButtonVariants> {
  icon?: React.ReactNode
  tooltip?: string
  badge?: number | string
}

export function FloatButton({
  className,
  position,
  size,
  icon,
  tooltip,
  badge,
  children,
  ...props
}: FloatButtonProps) {
  const button = (
    <Button
      size="icon"
      className={cn(floatButtonVariants({ position, size }), className)}
      {...props}
    >
      {icon || children}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
          {badge}
        </span>
      )}
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="left">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

interface FloatButtonGroupProps {
  children: React.ReactNode
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  direction?: "vertical" | "horizontal"
  className?: string
}

export function FloatButtonGroup({
  children,
  position = "bottom-right",
  direction = "vertical",
  className,
}: FloatButtonGroupProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  }

  return (
    <div
      className={cn(
        "fixed flex gap-2 z-50",
        positionClasses[position],
        direction === "vertical" ? "flex-col-reverse" : "flex-row",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<FloatButtonProps>, {
            position: undefined,
            className: cn(
              "relative bottom-auto right-auto left-auto top-auto translate-x-0",
              (child as React.ReactElement<FloatButtonProps>).props.className
            ),
          })
        }
        return child
      })}
    </div>
  )
}
