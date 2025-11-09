'use client'

/**
 * Mobile-optimized Presentation Viewer
 * Simplified version with only navigation and download options
 */

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Loader } from '../ai-elements/loader'
import * as fabric from 'fabric'
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { Button } from '../ui/button'
import { exportToPDF } from '@/lib/export/pdf-exporter'
import { exportToPPT } from '@/lib/export/ppt-exporter'
import { useSlideRenderer } from '@/lib/hooks/use-slide-renderer'
import { parseSlidesFromFiles } from '@/lib/utils/slide-parser'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FabricPresentationPreviewMobileProps {
    chatId: Id<"chats"> | null
    version: number
    isTemplate?: boolean
    templateFiles?: Record<string, string>
}

export function FabricPresentationPreviewMobile({
    chatId,
    version,
    isTemplate = false,
    templateFiles,
}: FabricPresentationPreviewMobileProps) {
    const filesFromQuery = useQuery(
        api.files.getAll,
        !isTemplate && chatId ? { chatId, version } : "skip"
    )
    const files = isTemplate ? templateFiles : filesFromQuery
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [slides, setSlides] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [canvasReady, setCanvasReady] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Extract slides from files
    useEffect(() => {
        if (!files) return
        const parsedSlides = parseSlidesFromFiles(files)
        setSlides(parsedSlides)
        setIsLoading(false)
    }, [files])

    // Initialize Fabric.js canvas
    useEffect(() => {
        if (!canvasElement || !containerRef.current || slides.length === 0) {
            return
        }

        if (fabricCanvasRef.current) {
            return
        }

        try {
            const container = containerRef.current
            const containerWidth = container.clientWidth - 16
            const containerHeight = container.clientHeight - 16
            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const baseScale = Math.min(scaleX, scaleY)
            const displayWidth = 1920 * baseScale
            const displayHeight = 1080 * baseScale

            const canvas = new fabric.Canvas(canvasElement, {
                width: displayWidth,
                height: displayHeight,
                backgroundColor: '#1a1a1a',
                selection: false,
            })

            canvas.setZoom(baseScale)
            canvas.viewportTransform = [baseScale, 0, 0, baseScale, 0, 0]

            fabricCanvasRef.current = canvas
            setCanvasReady(true)
        } catch (error) {
            console.error('Error initializing canvas:', error)
        }

        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose()
                fabricCanvasRef.current = null
                setCanvasReady(false)
            }
        }
    }, [canvasElement, slides])

    // Use custom hook for slide rendering
    useSlideRenderer(canvasReady, fabricCanvasRef, slides, currentSlide)

    // Handle window resize
    useEffect(() => {
        if (!canvasElement || !containerRef.current || !fabricCanvasRef.current) return

        const handleResize = () => {
            const container = containerRef.current
            if (!container || !fabricCanvasRef.current) return

            const containerWidth = container.clientWidth - 16
            const containerHeight = container.clientHeight - 16
            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const baseScale = Math.min(scaleX, scaleY)
            const displayWidth = 1920 * baseScale
            const displayHeight = 1080 * baseScale

            fabricCanvasRef.current.setWidth(displayWidth)
            fabricCanvasRef.current.setHeight(displayHeight)
            fabricCanvasRef.current.setZoom(baseScale)
            fabricCanvasRef.current.viewportTransform = [baseScale, 0, 0, baseScale, 0, 0]
            fabricCanvasRef.current.renderAll()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [canvasElement])

    // Touch swipe navigation
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
        if (touchStartX.current - touchEndX.current > 50) {
            // Swipe left - next slide
            goToNextSlide()
        }
        if (touchStartX.current - touchEndX.current < -50) {
            // Swipe right - previous slide
            goToPreviousSlide()
        }
    }

    // Navigation functions
    const goToNextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setIsTransitioning(true)
            setTimeout(() => {
                setCurrentSlide(prev => prev + 1)
                setTimeout(() => setIsTransitioning(false), 300)
            }, 150)
        }
    }

    const goToPreviousSlide = () => {
        if (currentSlide > 0) {
            setIsTransitioning(true)
            setTimeout(() => {
                setCurrentSlide(prev => prev - 1)
                setTimeout(() => setIsTransitioning(false), 300)
            }, 150)
        }
    }

    if (!files || isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-900">
                <div className="flex flex-col items-center gap-2 text-white">
                    <Loader />
                    <p>Loading presentation...</p>
                </div>
            </div>
        )
    }

    if (slides.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-900">
                <div className="text-white text-center p-8">
                    <p className="text-xl mb-4">No slides found</p>
                    <p className="text-sm text-white">
                        Make sure the AI has generated files in /slides/
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Canvas Container */}
            <div
                ref={containerRef}
                className={`
                    flex-1 relative flex items-center justify-center bg-zinc-900/50 p-2
                    transition-all duration-500
                    ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                `}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <canvas
                    ref={(el) => {
                        if (el && !canvasElement) {
                            setCanvasElement(el)
                        }
                    }}
                    className="shadow-2xl rounded-lg"
                    style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                />
            </div>

            {/* Bottom Controls */}
            <div className="bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-700/50 p-4">
                <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
                    {/* Previous Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPreviousSlide}
                        disabled={currentSlide === 0}
                        className="h-12 w-12 text-white hover:bg-blue-500/20 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0"
                    >
                        <ChevronLeft className="size-6 text-white" />
                    </Button>

                    {/* Slide Counter */}
                    <div className="flex items-center gap-2 bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700/50 flex-shrink-0">
                        <span className="text-sm text-zinc-300 whitespace-nowrap">
                            <span className="text-white font-bold">{currentSlide + 1}</span>
                            <span className="text-zinc-500 mx-1">/</span>
                            <span className="text-zinc-400">{slides.length}</span>
                        </span>
                    </div>

                    {/* Download Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 text-white hover:bg-blue-500/20 hover:text-blue-400 rounded-xl transition-all flex-shrink-0"
                            >
                                <FileDown className="size-6 text-white" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => exportToPDF(slides)}>
                                <FileDown className="size-4 mr-2" />
                                Download as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToPPT(slides)}>
                                <FileDown className="size-4 mr-2" />
                                Download as PPT
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Next Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextSlide}
                        disabled={currentSlide === slides.length - 1}
                        className="h-12 w-12 text-white hover:bg-blue-500/20 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0"
                    >
                        <ChevronRight className="size-6 text-white" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
