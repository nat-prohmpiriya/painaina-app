'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface PhotoUrlContextType {
    photoUrls: Record<string, string>
    loadPhotoUrl: (storageId: string) => Promise<void>
    isLoading: (storageId: string) => boolean
}

const PhotoUrlContext = createContext<PhotoUrlContextType>({
    photoUrls: {},
    loadPhotoUrl: async () => {},
    isLoading: () => false
})

interface PhotoUrlProviderProps {
    children: ReactNode
}

export function PhotoUrlProvider({ children }: PhotoUrlProviderProps) {
    const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

    const loadPhotoUrl = useCallback(async (storageId: string) => {
        // TODO: Implement photo URL loading with backend API
        // For now, just return empty to avoid errors
        console.warn('Photo URL loading not implemented yet')
    }, [photoUrls, loadingIds])

    const isLoading = useCallback((storageId: string) => {
        return loadingIds.has(storageId as string)
    }, [loadingIds])

    const contextValue = {
        photoUrls,
        loadPhotoUrl,
        isLoading
    }

    return (
        <PhotoUrlContext.Provider value={contextValue}>
            {children}
        </PhotoUrlContext.Provider>
    )
}

export function usePhotoUrls() {
    const context = useContext(PhotoUrlContext)
    if (!context) {
        throw new Error('usePhotoUrls must be used within PhotoUrlProvider')
    }
    return context
}