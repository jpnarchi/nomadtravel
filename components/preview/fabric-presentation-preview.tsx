'use client'

/**
 * Visualizador de Presentaciones con Fabric.js (Refactorizado)
 *
 * Este componente renderiza presentaciones usando Fabric.js canvas
 * Cada slide es un archivo JSON con objetos de Fabric.js
 */

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Loader } from '../ai-elements/loader'
import * as fabric from 'fabric'
import { ChevronLeft, ChevronRight, Maximize, Minimize, Grid3x3, ZoomIn, ZoomOut, FileDown, Presentation, SkipForward, SkipBack } from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { exportToPDF, PDFQuality } from '@/lib/export/pdf-exporter'
import { exportToPPT } from '@/lib/export/ppt-exporter'
import { useSlideRenderer } from '@/lib/hooks/use-slide-renderer'
import { parseSlidesFromFiles } from '@/lib/utils/slide-parser'
import { ThumbnailsSidebar } from './thumbnails-sidebar'
import { toast } from 'sonner'

interface FabricPresentationPreviewProps {
    chatId: Id<"chats"> | null
    version: number
    isTemplate?: boolean
    templateFiles?: Record<string, string>
}

export function FabricPresentationPreview({
    chatId,
    version,
    isTemplate = false,
    templateFiles,
}: FabricPresentationPreviewProps) {
    const filesFromQuery = useQuery(
        api.files.getAll,
        !isTemplate && chatId ? { chatId, version } : "skip"
    )
    const files = isTemplate ? templateFiles : filesFromQuery
    const userInfo = useQuery(api.users.getUserInfo)
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [slides, setSlides] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [canvasReady, setCanvasReady] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showThumbnails, setShowThumbnails] = useState(true)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(1)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

    // Check if user can export to PowerPoint
    const canExportToPPT = () => {
        if (!userInfo) return false
        // Allow admins
        if (userInfo.role === 'admin') return true
        // Allow paying users (pro, premium, ultra)
        if (userInfo.plan === 'pro' || userInfo.plan === 'premium' || userInfo.plan === 'ultra') return true
        // Block free users
        return false
    }

    // Handle PowerPoint export with authorization
    const handlePPTExport = () => {
        if (!canExportToPPT()) {
            toast.error('PowerPoint export is only available for Pro, Premium, and Ultra users', {
                description: 'Upgrade your plan to unlock this feature'
            })
            return
        }
        exportToPPT(slides)
    }

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
            console.log('⏳ Esperando canvas element y slides...')
            return
        }

        if (fabricCanvasRef.current) {
            console.log('⚠️ Canvas ya inicializado')
            return
        }

        console.log('🎨 Inicializando Fabric.js canvas')

        try {
            const container = containerRef.current
            const containerWidth = container.clientWidth - 32
            const containerHeight = container.clientHeight - 112
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
            console.log('✅ Preview - Canvas inicializado')
        } catch (error) {
            console.error('❌ Error inicializando canvas:', error)
        }

        return () => {
            if (fabricCanvasRef.current) {
                console.log('🧹 Limpiando canvas')
                fabricCanvasRef.current.dispose()
                fabricCanvasRef.current = null
                setCanvasReady(false)
            }
        }
    }, [canvasElement, slides])

    // Use custom hook for slide rendering
    useSlideRenderer(canvasReady, fabricCanvasRef, slides, currentSlide)

    // Apply zoom changes
    useEffect(() => {
        if (!canvasElement || !containerRef.current || !fabricCanvasRef.current) return

        const container = containerRef.current
        const containerWidth = container.clientWidth - 32
        const containerHeight = container.clientHeight - 112
        const scaleX = containerWidth / 1920
        const scaleY = containerHeight / 1080
        const baseScale = Math.min(scaleX, scaleY)
        const finalScale = baseScale * zoomLevel
        const displayWidth = 1920 * finalScale
        const displayHeight = 1080 * finalScale

        fabricCanvasRef.current.setWidth(displayWidth)
        fabricCanvasRef.current.setHeight(displayHeight)
        fabricCanvasRef.current.setZoom(finalScale)
        fabricCanvasRef.current.viewportTransform = [finalScale, 0, 0, finalScale, 0, 0]
        fabricCanvasRef.current.renderAll()
    }, [canvasElement, zoomLevel, showThumbnails, isFullscreen])

    // Handle window resize
    useEffect(() => {
        if (!canvasElement || !containerRef.current || !fabricCanvasRef.current) return

        const handleResize = () => {
            const container = containerRef.current
            if (!container || !fabricCanvasRef.current) return

            const containerWidth = container.clientWidth - 32
            const containerHeight = container.clientHeight - 112
            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const baseScale = Math.min(scaleX, scaleY)
            const finalScale = baseScale * zoomLevel
            const displayWidth = 1920 * finalScale
            const displayHeight = 1080 * finalScale

            fabricCanvasRef.current.setWidth(displayWidth)
            fabricCanvasRef.current.setHeight(displayHeight)
            fabricCanvasRef.current.setZoom(finalScale)
            fabricCanvasRef.current.viewportTransform = [finalScale, 0, 0, finalScale, 0, 0]
            fabricCanvasRef.current.renderAll()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [canvasElement, zoomLevel])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault()
                goToNextSlide()
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                goToPreviousSlide()
            } else if (e.key === 'Home') {
                e.preventDefault()
                setCurrentSlide(0)
            } else if (e.key === 'End') {
                e.preventDefault()
                setCurrentSlide(slides.length - 1)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [slides.length, currentSlide])

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

    const handleSlideClick = (index: number) => {
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentSlide(index)
            setTimeout(() => setIsTransitioning(false), 300)
        }, 150)
    }

    // Zoom controls
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3))
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.25))
    const handleZoomReset = () => setZoomLevel(1)

    // Fullscreen
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

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                e.preventDefault()
                document.exitFullscreen()
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault()
                toggleFullscreen()
            } else if (e.key === 't' || e.key === 'T') {
                e.preventDefault()
                setShowThumbnails(!showThumbnails)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen, showThumbnails])

    // Mouse panning
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        setScrollStart({
            x: containerRef.current.scrollLeft,
            y: containerRef.current.scrollTop
        })
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grabbing'
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning || !containerRef.current) return
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        containerRef.current.scrollLeft = scrollStart.x - dx
        containerRef.current.scrollTop = scrollStart.y - dy
    }

    const handleMouseUp = () => {
        setIsPanning(false)
        if (containerRef.current) {
            containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default'
        }
    }

    const handleMouseLeave = () => {
        if (isPanning) {
            setIsPanning(false)
            if (containerRef.current) {
                containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default'
            }
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
        <TooltipProvider>
            <div ref={fullscreenRef} className="h-full w-full flex bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 relative">
                {/* Thumbnails Sidebar */}
                {showThumbnails && !isFullscreen && (
                    <ThumbnailsSidebar
                        slides={slides}
                        currentSlide={currentSlide}
                        onSlideClick={handleSlideClick}
                        onClose={() => setShowThumbnails(false)}
                    />
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative">
                    {/* Top Control Bar */}
                    {!isFullscreen && (
                        <div className="h-16 bg-gradient-to-r from-zinc-900/95 via-zinc-900/90 to-zinc-900/95 backdrop-blur-xl border-b border-zinc-700/50 flex items-center justify-center px-6 z-50 shadow-lg relative">
                            {!showThumbnails && (
                                <div className="absolute left-6">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowThumbnails(true)}
                                                className="h-9 hover:bg-white/10 transition-all text-white"
                                            >
                                                <Grid3x3 className="size-4 mr-2 text-white" />
                                                Thumbnails
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Show thumbnails (T)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-zinc-800/50 px-4 py-2 rounded-lg border border-zinc-700/50">
                                    <Presentation className="size-4 text-blue-400" />
                                    <span className="text-sm text-zinc-300">
                                        Slide <span className="text-white font-bold">{currentSlide + 1}</span>
                                        <span className="text-zinc-500 mx-1">/</span>
                                        <span className="text-zinc-400">{slides.length}</span>
                                    </span>
                                </div>

                                <div className="h-8 w-px bg-zinc-700/50" />

                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 hover:bg-blue-500/10 hover:text-blue-400 transition-all text-white"
                                                >
                                                    <FileDown className="size-4 mr-2 text-white" />
                                                    PDF
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Export presentation as PDF</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuContent align="center">
                                        <DropdownMenuItem onClick={() => exportToPDF(slides, undefined, 'standard')}>
                                            Standard Quality (2x)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => exportToPDF(slides, undefined, 'high')}>
                                            High Quality (3x) - Recommended
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => exportToPDF(slides, undefined, 'print')}>
                                            Print Quality (4x)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handlePPTExport}
                                            className="h-9 hover:bg-blue-500/10 hover:text-blue-400 transition-all text-white"
                                        >
                                            <FileDown className="size-4 mr-2 text-white" />
                                            PPT
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Export as PowerPoint</p>
                                    </TooltipContent>
                                </Tooltip>

                                <div className="h-8 w-px bg-zinc-700/50 mx-1" />

                                <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-1 py-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleZoomOut}
                                                disabled={zoomLevel <= 0.25}
                                                className="h-8 w-8 hover:bg-white/10 disabled:opacity-30 transition-all"
                                            >
                                                <ZoomOut className="size-4 text-white" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Zoom out (Ctrl -)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleZoomReset}
                                                className="h-8 px-3 text-xs text-white font-bold min-w-[55px] hover:bg-white/10 hover:text-white transition-all"
                                            >
                                                {Math.round(zoomLevel * 100)}%
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Reset zoom (Ctrl 0)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleZoomIn}
                                                disabled={zoomLevel >= 3}
                                                className="h-8 w-8 hover:bg-white/10 disabled:opacity-30 transition-all"
                                            >
                                                <ZoomIn className="size-4 text-white" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Zoom in (Ctrl +)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="h-8 w-px bg-zinc-700/50 mx-1" />

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={toggleFullscreen}
                                            className="h-9 hover:bg-blue-500/10 hover:text-blue-400 text-white transition-all"
                                        >
                                            <Maximize className="size-4 mr-2 text-white" />
                                            Fullscreen
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Fullscreen mode (F)</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    )}

                    {/* Canvas Container */}
                    <div
                        ref={containerRef}
                        className={`
                            flex-1 relative flex items-start justify-center bg-zinc-900/50 overflow-auto p-6 pb-28
                            transition-all duration-500
                            ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                        `}
                        style={{
                            cursor: isPanning ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'),
                            userSelect: isPanning ? 'none' : 'auto'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        <canvas
                            ref={(el) => {
                                if (el && !canvasElement) {
                                    console.log('📍 Canvas element montado en el DOM:', el)
                                    setCanvasElement(el)
                                }
                            }}
                            className="shadow-2xl rounded-lg flex-shrink-0 ring-1 ring-white/10"
                            style={{
                                display: 'block',
                                boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.1)',
                            }}
                        />
                    </div>

                    {/* Navigation Controls */}
                    <div className={`
                        absolute bottom-8 left-1/2 transform -translate-x-1/2
                        flex items-center gap-3 bg-gradient-to-r from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-2xl rounded-2xl px-6 py-3
                        shadow-2xl border border-zinc-700/50 animate-in slide-in-from-bottom duration-500
                        hover:shadow-blue-500/10 hover:border-zinc-600/50 transition-all
                    `}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCurrentSlide(0)}
                                    disabled={currentSlide === 0}
                                    className="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                                >
                                    <SkipBack className="size-5 text-white" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>First slide (Home)</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={goToPreviousSlide}
                                    disabled={currentSlide === 0}
                                    className="h-11 w-11 text-white hover:bg-blue-500/20 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                                >
                                    <ChevronLeft className="size-6 text-white" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Previous (←)</p>
                            </TooltipContent>
                        </Tooltip>

                        <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-xl">
                            {slides.map((_, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleSlideClick(index)}
                                            className={`
                                                h-2 rounded-full transition-all duration-300
                                                ${index === currentSlide
                                                    ? 'w-10 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50'
                                                    : 'w-2 bg-white/30 hover:bg-white/60 hover:w-4'
                                                }
                                            `}
                                            aria-label={`Ir al slide ${index + 1}`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Slide {index + 1}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={goToNextSlide}
                                    disabled={currentSlide === slides.length - 1}
                                    className="h-11 w-11 text-white hover:bg-blue-500/20 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                                >
                                    <ChevronRight className="size-6 text-white" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Next (→)</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCurrentSlide(slides.length - 1)}
                                    disabled={currentSlide === slides.length - 1}
                                    className="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                                >
                                    <SkipForward className="size-5 text-white" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Last slide (End)</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Fullscreen Exit Button */}
                    {isFullscreen && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleFullscreen}
                                    className="absolute top-6 right-6 h-12 w-12 text-white hover:bg-white/20 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl transition-all hover:scale-105"
                                >
                                    <Minimize className="size-5 text-white" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Exit fullscreen (Esc)</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Fullscreen Info */}
                    {isFullscreen && (
                        <>
                            <div className="absolute top-6 left-6 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/10 shadow-xl">
                                <div className="flex items-center gap-2">
                                    <Presentation className="size-4 text-blue-400" />
                                    <span className="text-white text-sm font-bold">{currentSlide + 1}</span>
                                    <span className="text-zinc-500 text-sm">/</span>
                                    <span className="text-zinc-300 text-sm">{slides.length}</span>
                                </div>
                            </div>

                            <div className="absolute top-6 right-20 flex items-center gap-1 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-xl rounded-2xl px-2 py-2 border border-white/10 shadow-xl">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleZoomOut}
                                            disabled={zoomLevel <= 0.25}
                                            className="h-9 w-9 text-white hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all"
                                        >
                                            <ZoomOut className="size-4 text-white" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Zoom out (Ctrl -)</p>
                                    </TooltipContent>
                                </Tooltip>
                                <span className="text-white text-xs font-bold px-2 min-w-[50px] text-center">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleZoomIn}
                                            disabled={zoomLevel >= 3}
                                            className="h-9 w-9 text-white hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all"
                                        >
                                            <ZoomIn className="size-4 text-white" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Zoom in (Ctrl +)</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
