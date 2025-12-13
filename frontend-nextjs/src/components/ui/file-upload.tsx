"use client"

import * as React from "react"
import { useDropzone, type DropzoneOptions, type FileRejection } from "react-dropzone"
import { Upload, X, File, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface FileUploadProps extends Omit<DropzoneOptions, "onDrop"> {
  value?: File[]
  onChange?: (files: File[]) => void
  onRemove?: (index: number) => void
  className?: string
  dropzoneClassName?: string
  showPreview?: boolean
  maxFiles?: number
  description?: string
  children?: React.ReactNode
}

export function FileUpload({
  value = [],
  onChange,
  onRemove,
  className,
  dropzoneClassName,
  showPreview = true,
  maxFiles = 1,
  description,
  children,
  accept,
  maxSize,
  disabled,
  ...dropzoneOptions
}: FileUploadProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        console.error("Rejected files:", rejectedFiles)
      }
      if (acceptedFiles.length > 0) {
        const newFiles = maxFiles === 1 ? acceptedFiles : [...value, ...acceptedFiles].slice(0, maxFiles)
        onChange?.(newFiles)
      }
    },
    [onChange, value, maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled,
    ...dropzoneOptions,
  })

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index)
    } else {
      const newFiles = value.filter((_, i) => i !== index)
      onChange?.(newFiles)
    }
  }

  const isImage = (file: File) => file.type.startsWith("image/")

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragActive && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          disabled && "cursor-not-allowed opacity-50",
          !isDragActive && !isDragReject && "border-muted-foreground/25 hover:border-primary/50",
          dropzoneClassName
        )}
      >
        <input {...getInputProps()} />
        {children || (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              {isDragActive ? (
                "Drop files here..."
              ) : (
                <>
                  <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </div>

      {showPreview && value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {isImage(file) ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ImageUploadProps extends Omit<FileUploadProps, "accept" | "showPreview"> {
  aspectRatio?: "square" | "video" | "wide"
  previewClassName?: string
}

export function ImageUpload({
  value = [],
  onChange,
  onRemove,
  className,
  dropzoneClassName,
  maxFiles = 1,
  aspectRatio = "square",
  previewClassName,
  ...props
}: ImageUploadProps) {
  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[2/1]",
  }

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index)
    } else {
      const newFiles = value.filter((_, i) => i !== index)
      onChange?.(newFiles)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {value.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={cn(
                "relative rounded-lg overflow-hidden border group",
                aspectRatioClass[aspectRatio],
                previewClassName
              )}
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {value.length < maxFiles && (
            <FileUpload
              {...props}
              value={value}
              onChange={onChange}
              accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
              showPreview={false}
              maxFiles={maxFiles}
              dropzoneClassName={cn(
                aspectRatioClass[aspectRatio],
                dropzoneClassName
              )}
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-2">Add image</span>
            </FileUpload>
          )}
        </div>
      ) : (
        <FileUpload
          {...props}
          value={value}
          onChange={onChange}
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
          showPreview={false}
          maxFiles={maxFiles}
          dropzoneClassName={cn(
            aspectRatioClass[aspectRatio],
            dropzoneClassName
          )}
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, GIF up to 10MB
          </p>
        </FileUpload>
      )}
    </div>
  )
}
