'use client'

import { useEffect, useState } from 'react'

export function useMobileViewport() {
    const [viewportHeight, setViewportHeight] = useState('100vh')

    useEffect(() => {
        const updateViewportHeight = () => {
            // Use window.innerHeight which gives us the actual visible viewport
            // excluding static navigation bars on mobile Safari
            const actualHeight = window.innerHeight
            setViewportHeight(`${actualHeight}px`)
        }

        // Set initial value
        updateViewportHeight()

        // Update on resize and orientation change
        window.addEventListener('resize', updateViewportHeight)
        window.addEventListener('orientationchange', updateViewportHeight)

        return () => {
            window.removeEventListener('resize', updateViewportHeight)
            window.removeEventListener('orientationchange', updateViewportHeight)
        }
    }, [])

    return viewportHeight
}
