import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fileService } from '@/services'
import type { FileMetadata } from '@/interfaces'

// ============================================
// Query Keys
// ============================================
export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  list: (tripId?: string, entryId?: string) => [...fileKeys.lists(), { tripId, entryId }] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: string) => [...fileKeys.details(), id] as const,
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch list of files
 */
export const useFiles = (tripId?: string, entryId?: string) => {
  return useQuery({
    queryKey: fileKeys.list(tripId, entryId),
    queryFn: () => fileService.listFiles(tripId, entryId),
  })
}

/**
 * Fetch single file metadata
 */
export const useFile = (fileId: string) => {
  return useQuery({
    queryKey: fileKeys.detail(fileId),
    queryFn: () => fileService.getFile(fileId),
    enabled: !!fileId,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Upload file
 */
export const useUploadFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      tripId,
      entryId,
    }: {
      file: File
      tripId?: string
      entryId?: string
    }) => fileService.uploadFile(file, tripId, entryId),
    onSuccess: (_, variables) => {
      // Invalidate relevant file lists
      queryClient.invalidateQueries({
        queryKey: fileKeys.list(variables.tripId, variables.entryId),
      })
      // Also invalidate general list
      queryClient.invalidateQueries({ queryKey: fileKeys.lists() })
    },
  })
}

/**
 * Delete file
 */
export const useDeleteFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId),
    onSuccess: () => {
      // Invalidate all file queries
      queryClient.invalidateQueries({ queryKey: fileKeys.all })
    },
  })
}
