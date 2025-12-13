"use client"

import { useEffect, useRef, useState } from "react"

type Size = {
    width: number
    height: number
}

// Returns current window size. Safe for SSR — returns 0/0 on server.
export default function useWindowSize(): Size {
    const isClient = typeof window !== "undefined"

    const getSize = (): Size => ({
        width: isClient ? window.innerWidth : 0,
        height: isClient ? window.innerHeight : 0,
    })

    const [size, setSize] = useState<Size>(getSize)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        if (!isClient) return

        const handle = () => {
            // Throttle updates to animation frames
            if (rafRef.current != null) return
            rafRef.current = window.requestAnimationFrame(() => {
                rafRef.current = null
                setSize({ width: window.innerWidth, height: window.innerHeight })
            })
        }

        window.addEventListener("resize", handle, { passive: true })

        // Also listen to orientationchange for mobile
        window.addEventListener("orientationchange", handle, { passive: true })

        return () => {
            window.removeEventListener("resize", handle)
            window.removeEventListener("orientationchange", handle)
            if (rafRef.current != null) {
                window.cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return size
}

