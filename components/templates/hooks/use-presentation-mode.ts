/**
 * Hook para gestionar el modo de presentación fullscreen
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import * as fabric from 'fabric'
import { AspectRatioType, getAspectRatioDimensions } from '@/lib/aspect-ratios'

interface UsePresentationModeProps {
    aspectRatio: AspectRatioType
    slides: any[]
    currentSlideIndex: number
    setCurrentSlideIndex: (index: number) => void
}

export function usePresentationMode({
    aspectRatio,
    slides,
    currentSlideIndex,
    setCurrentSlideIndex
}: UsePresentationModeProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [presentationCanvasElement, setPresentationCanvasElement] = useState<HTMLCanvasElement | null>(null)
    const [presentationCanvasReady, setPresentationCanvasReady] = useState(false)
    const presentationCanvasRef = useRef<fabric.Canvas | null>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)

    const aspectRatioDimensions = useMemo(() => getAspectRatioDimensions(aspectRatio), [aspectRatio])

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!fullscreenRef.current) return

        if (!document.fullscreenElement) {
            fullscreenRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true)
            }).catch((err) => {
                console.error('Error attempting to enable fullscreen:', err)
            })
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false)
            })
        }
    }

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Initialize presentation canvas when in fullscreen
    useEffect(() => {
        if (!isFullscreen) {
            if (presentationCanvasRef.current) {
                presentationCanvasRef.current.dispose()
                presentationCanvasRef.current = null
                setPresentationCanvasReady(false)
                setPresentationCanvasElement(null)
            }
            return
        }

        if (!presentationCanvasElement || presentationCanvasRef.current) {
            return
        }

        try {
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            const availableWidth = viewportWidth * 0.9
            const availableHeight = viewportHeight * 0.75

            const targetAspectRatio = aspectRatioDimensions.ratio
            let displayWidth = availableWidth
            let displayHeight = displayWidth / targetAspectRatio

            if (displayHeight > availableHeight) {
                displayHeight = availableHeight
                displayWidth = displayHeight * targetAspectRatio
            }

            const canvas = new fabric.Canvas(presentationCanvasElement, {
                width: displayWidth,
                height: displayHeight,
                backgroundColor: '#ffffff',
                selection: false,
            })

            const scale = displayWidth / aspectRatioDimensions.width
            canvas.setZoom(scale)
            canvas.setDimensions({
                width: displayWidth,
                height: displayHeight
            })

            presentationCanvasRef.current = canvas
            setPresentationCanvasReady(true)
        } catch (error) {
            console.error('Error initializing presentation canvas:', error)
        }
    }, [isFullscreen, presentationCanvasElement, aspectRatioDimensions])

    // Handle window resize in presentation mode
    useEffect(() => {
        if (!isFullscreen || !presentationCanvasRef.current) return

        const handleResize = () => {
            if (!presentationCanvasRef.current) return

            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            const availableWidth = viewportWidth * 0.9
            const availableHeight = viewportHeight * 0.75

            const targetAspectRatio = aspectRatioDimensions.ratio
            let displayWidth = availableWidth
            let displayHeight = displayWidth / targetAspectRatio

            if (displayHeight > availableHeight) {
                displayHeight = availableHeight
                displayWidth = displayHeight * targetAspectRatio
            }

            const scale = displayWidth / aspectRatioDimensions.width
            presentationCanvasRef.current.setZoom(scale)
            presentationCanvasRef.current.setDimensions({
                width: displayWidth,
                height: displayHeight
            })
            presentationCanvasRef.current.renderAll()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isFullscreen, aspectRatioDimensions])

    // Navigation
    const goToPreviousSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1)
        }
    }

    const goToNextSlide = () => {
        if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1)
        }
    }

    // Keyboard shortcuts for fullscreen and navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement
            const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

            if (isTextInput) return

            if (e.key === 'f' || e.key === 'F') {
                if (!isFullscreen) {
                    e.preventDefault()
                    toggleFullscreen()
                }
            } else if (e.key === 'Escape' && isFullscreen) {
                e.preventDefault()
                document.exitFullscreen()
            } else if (e.key === 'ArrowRight' || (e.key === ' ' && isFullscreen)) {
                e.preventDefault()
                goToNextSlide()
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                goToPreviousSlide()
            } else if (isFullscreen) {
                if (e.key === 'Home') {
                    e.preventDefault()
                    setCurrentSlideIndex(0)
                } else if (e.key === 'End') {
                    e.preventDefault()
                    setCurrentSlideIndex(slides.length - 1)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen, currentSlideIndex, slides.length])

    return {
        isFullscreen,
        fullscreenRef,
        toggleFullscreen,
        presentationCanvasElement,
        setPresentationCanvasElement,
        presentationCanvasRef,
        presentationCanvasReady,
        goToPreviousSlide,
        goToNextSlide
    }
}
