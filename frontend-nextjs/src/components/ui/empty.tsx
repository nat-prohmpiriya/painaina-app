"use client"

import { Inbox, FileX, Search, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyType = "default" | "no-data" | "no-results" | "empty-folder"

interface EmptyProps {
  type?: EmptyType
  description?: string
  children?: React.ReactNode
  className?: string
  iconClassName?: string
}

const icons = {
  default: Inbox,
  "no-data": FileX,
  "no-results": Search,
  "empty-folder": FolderOpen,
}

const defaultDescriptions = {
  default: "No data",
  "no-data": "No data available",
  "no-results": "No results found",
  "empty-folder": "This folder is empty",
}

export function Empty({
  type = "default",
  description,
  children,
  className,
  iconClassName,
}: EmptyProps) {
  const Icon = icons[type]
  const displayDescription = description || defaultDescriptions[type]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-center",
        className
      )}
    >
      <Icon
        className={cn(
          "h-12 w-12 text-muted-foreground/50 mb-4",
          iconClassName
        )}
      />
      <p className="text-sm text-muted-foreground">{displayDescription}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
