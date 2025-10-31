'use client'

/**
 * Visualizador de Presentaciones con Fabric.js
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
import { ChevronLeft, ChevronRight, Maximize, Minimize, Grid3x3, Menu, X, ZoomIn, ZoomOut, RotateCcw, FileDown } from 'lucide-react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { jsPDF } from 'jspdf'
import PptxGenJS from 'pptxgenjs'
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
    const [zoomLevel, setZoomLevel] = useState(1) // 1 = 100%, 0.5 = 50%, 2 = 200%
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

    // Extract slides from files
    useEffect(() => {
        if (!files) return

        console.log('📁 Archivos recibidos:', Object.keys(files))

        const slideFiles = Object.entries(files)
            .filter(([path]) => {
                const isSlide = path.startsWith('/slides/') && path.endsWith('.json')
                console.log(`🔍 Verificando ${path}: ${isSlide}`)
                return isSlide
            })
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([path, content]) => {
                try {
                    console.log(`✅ Parseando ${path}`, content.substring(0, 100))
                    const parsed = JSON.parse(content)
                    console.log(`✅ Slide parseado:`, parsed)
                    return parsed
                } catch (error) {
                    console.error(`❌ Error parsing ${path}:`, error)
                    return null
                }
            })
            .filter(slide => slide !== null)

        console.log(`🎬 Total slides encontrados: ${slideFiles.length}`)
        console.log(`🎬 Slides:`, slideFiles)
        setSlides(slideFiles)
        setIsLoading(false)
    }, [files])

    // Initialize Fabric.js canvas when both canvas element and slides are ready
    useEffect(() => {
        // Need both canvas element and slides
        if (!canvasElement || !containerRef.current || slides.length === 0) {
            console.log('⏳ Esperando canvas element y slides...', {
                hasCanvasElement: !!canvasElement,
                hasContainer: !!containerRef.current,
                slidesCount: slides.length
            })
            return
        }

        // Prevent double initialization
        if (fabricCanvasRef.current) {
            console.log('⚠️ Canvas ya inicializado')
            return
        }

        console.log('🎨 Inicializando Fabric.js canvas con elemento:', canvasElement)

        try {
            // Initialize fabric canvas with original dimensions
            const canvas = new fabric.Canvas(canvasElement, {
                width: 1920,
                height: 1080,
                backgroundColor: '#1a1a1a',
                selection: false,
            })

            fabricCanvasRef.current = canvas
            setCanvasReady(true)
            console.log('✅ Preview - Canvas de Fabric.js inicializado correctamente')
        } catch (error) {
            console.error('❌ Error inicializando canvas:', error)
        }

        // Cleanup
        return () => {
            if (fabricCanvasRef.current) {
                console.log('🧹 Limpiando canvas')
                fabricCanvasRef.current.dispose()
                fabricCanvasRef.current = null
                setCanvasReady(false)
            }
        }
    }, [canvasElement, slides])

    // Render current slide
    useEffect(() => {
        if (!canvasReady || !fabricCanvasRef.current || slides.length === 0) {
            console.log('❌ Esperando...', {
                canvasReady,
                canvas: !!fabricCanvasRef.current,
                slidesLength: slides.length
            })
            return
        }

        const canvas = fabricCanvasRef.current
        const slide = slides[currentSlide]

        console.log(`🎨 Renderizando slide ${currentSlide + 1}:`, slide)

        if (!slide) {
            console.log('❌ Slide no encontrado')
            return
        }

        // Clear canvas
        canvas.clear()
        console.log('🧹 Canvas limpiado')

        // Set background
        if (slide.background) {
            canvas.backgroundColor = slide.background
            console.log('🎨 Background configurado:', slide.background)
        }

        // Load objects from JSON asynchronously
        const loadSlideObjects = async () => {
            if (!slide.objects || !Array.isArray(slide.objects)) {
                canvas.renderAll()
                return
            }

            // Sort objects by zIndex to preserve layer order
            const sortedObjects = [...slide.objects].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            console.log(`📦 Cargando ${sortedObjects.length} objetos en orden`)
            console.log(`🔢 Objetos ordenados por zIndex:`, sortedObjects.map((obj, i) => ({
                type: obj.type,
                zIndex: obj.zIndex,
                position: i
            })))

            // Create promises for all objects
            const objectPromises = sortedObjects.map(async (obj: any, index: number) => {
                console.log(`🔸 Objeto ${index}:`, obj.type, obj)
                try {
                    // Normalize type to lowercase for comparison
                    const objType = (obj.type || '').toLowerCase()

                    let fabricObj: fabric.FabricObject | null = null

                    switch (objType) {
                        case 'text':
                        case 'i-text':
                        case 'itext':  // IText se normaliza a 'itext' sin guión
                        case 'textbox':
                            console.log(`📝 Creando texto: "${obj.text}"`)
                            fabricObj = new fabric.IText(obj.text || 'Text', {
                                left: obj.left,
                                top: obj.top,
                                fontSize: obj.fontSize || 40,
                                fill: obj.fill || '#000000',
                                fontFamily: obj.fontFamily || 'Arial',
                                fontWeight: obj.fontWeight || 'normal',
                                textAlign: obj.textAlign || 'left',
                            })
                            // Apply additional properties
                            if (obj.originX) fabricObj.set('originX', obj.originX)
                            if (obj.originY) fabricObj.set('originY', obj.originY)
                            if (obj.angle !== undefined) fabricObj.set('angle', obj.angle)
                            if (obj.scaleX !== undefined) fabricObj.set('scaleX', obj.scaleX)
                            if (obj.scaleY !== undefined) fabricObj.set('scaleY', obj.scaleY)
                            break
                        case 'rect':
                        case 'rectangle':
                            console.log(`📦 Creando rectángulo`)
                            fabricObj = new fabric.Rect({
                                left: obj.left,
                                top: obj.top,
                                width: obj.width || 100,
                                height: obj.height || 100,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                rx: obj.rx || 0,
                                ry: obj.ry || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break
                        case 'circle':
                            console.log(`⭕ Creando círculo`)
                            fabricObj = new fabric.Circle({
                                left: obj.left,
                                top: obj.top,
                                radius: obj.radius || 50,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break
                        case 'triangle':
                            console.log(`🔺 Creando triángulo`)
                            fabricObj = new fabric.Triangle({
                                left: obj.left,
                                top: obj.top,
                                width: obj.width || 100,
                                height: obj.height || 100,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break
                        case 'line':
                            console.log(`📏 Creando línea`)
                            fabricObj = new fabric.Line([obj.x1 || 0, obj.y1 || 0, obj.x2 || 100, obj.y2 || 100], {
                                stroke: obj.stroke || '#000000',
                                strokeWidth: obj.strokeWidth || 1,
                            })
                            break
                        case 'image':
                            console.log(`🖼️ Creando imagen desde: ${obj.src}`)
                            if (obj.src) {
                                try {
                                    const img = await fabric.FabricImage.fromURL(obj.src, { crossOrigin: 'anonymous' })
                                    if (obj.left !== undefined) img.set('left', obj.left)
                                    if (obj.top !== undefined) img.set('top', obj.top)
                                    if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
                                    if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
                                    if (obj.angle !== undefined) img.set('angle', obj.angle)
                                    img.set({ selectable: false, evented: false })
                                    fabricObj = img
                                    console.log(`✅ Imagen ${index} cargada`)
                                } catch (err) {
                                    console.error('Error loading image:', err)
                                    return null
                                }
                            }
                            break
                        default:
                            console.warn(`Unknown object type: ${obj.type} (normalized: ${objType})`)
                            return null
                    }

                    if (fabricObj) {
                        fabricObj.set({
                            selectable: false,
                            evented: false,
                        })
                        console.log(`✅ Objeto ${index} creado`)
                        return fabricObj
                    }
                    return null
                } catch (error) {
                    console.error('❌ Error creating fabric object:', error, obj)
                    return null
                }
            })

            // Wait for all objects to load
            const loadedObjects = await Promise.all(objectPromises)

            // Add all loaded objects to canvas
            loadedObjects.forEach((obj, index) => {
                if (obj) {
                    canvas.add(obj)
                    console.log(`✅ Objeto ${index} agregado al canvas`)
                }
            })

            console.log('🎨 Renderizando canvas...')
            canvas.renderAll()
            console.log('✅ Canvas renderizado. Objetos en canvas:', canvas.getObjects().length)
        }

        // Execute async loading
        loadSlideObjects()
    }, [currentSlide, slides, canvasReady])

    // Apply zoom and scale to fit container
    useEffect(() => {
        if (!canvasElement || !containerRef.current || !fabricCanvasRef.current) return

        const container = containerRef.current
        // Get actual available space, accounting for padding (p-4 = 16px, pb-24 = 96px)
        const containerWidth = container.clientWidth - 32 // 16px left + 16px right
        const containerHeight = container.clientHeight - 112 // 16px top + 96px bottom

        // Calculate scale to fit 1920x1080 in container (this ensures slides fill the container)
        const scaleX = containerWidth / 1920
        const scaleY = containerHeight / 1080
        const baseFitScale = Math.min(scaleX, scaleY) // Scale to fit container perfectly

        // Apply zoom level on top of the base fit scale
        const finalScale = baseFitScale * zoomLevel

        // Calculate final display dimensions
        const displayWidth = 1920 * finalScale
        const displayHeight = 1080 * finalScale

        // Apply CSS scaling to make canvas fit the desired size
        canvasElement.style.width = `${displayWidth}px`
        canvasElement.style.height = `${displayHeight}px`

        console.log('🔍 Zoom aplicado:', {
            containerWidth,
            containerHeight,
            baseFitScale,
            zoomLevel,
            finalScale,
            displayWidth,
            displayHeight
        })

        // Re-render canvas to reflect any changes
        fabricCanvasRef.current.renderAll()
    }, [canvasElement, zoomLevel, showThumbnails, isFullscreen])

    // Handle window resize - trigger zoom recalculation
    useEffect(() => {
        if (!canvasElement || !containerRef.current || !fabricCanvasRef.current) return

        const handleResize = () => {
            const container = containerRef.current
            if (!container || !canvasElement) return

            // Get actual available space, accounting for padding (p-4 = 16px, pb-24 = 96px)
            const containerWidth = container.clientWidth - 32
            const containerHeight = container.clientHeight - 112
            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const baseFitScale = Math.min(scaleX, scaleY)
            const finalScale = baseFitScale * zoomLevel
            const displayWidth = 1920 * finalScale
            const displayHeight = 1080 * finalScale

            canvasElement.style.width = `${displayWidth}px`
            canvasElement.style.height = `${displayHeight}px`

            fabricCanvasRef.current?.renderAll()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slides.length, currentSlide])

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

    // Zoom controls
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 3)) // Max 300%
    }

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.25)) // Min 25%
    }

    const handleZoomReset = () => {
        setZoomLevel(1) // Reset to 100%
    }

    // Toggle fullscreen mode
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

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Handle Escape key to exit fullscreen and other shortcuts
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
            } else if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleZoomIn()
            } else if ((e.key === '-' || e.key === '_') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleZoomOut()
            } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleZoomReset()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen, showThumbnails])

    // Handle mouse panning
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return

        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        setScrollStart({
            x: containerRef.current.scrollLeft,
            y: containerRef.current.scrollTop
        })

        // Change cursor to grabbing
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

        // Reset cursor
        if (containerRef.current) {
            containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default'
        }
    }

    const handleMouseLeave = () => {
        if (isPanning) {
            setIsPanning(false)

            // Reset cursor
            if (containerRef.current) {
                containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default'
            }
        }
    }

    // Export to PDF
    const handleExportToPDF = async () => {
        if (!fabricCanvasRef.current || slides.length === 0) {
            toast.error('No hay slides para exportar')
            return
        }

        try {
            toast.loading('Exportando a PDF...')

            // Create PDF with 16:9 aspect ratio (matching slide dimensions)
            // Using custom page size to match 16:9 exactly
            const slideAspectRatio = 16 / 9
            const pageWidth = 297 // mm
            const pageHeight = pageWidth / slideAspectRatio // Calculate height to maintain 16:9

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [pageHeight, pageWidth] // [height, width] for landscape
            })

            // Save current slide
            const currentSlideIndex = currentSlide

            // Export each slide
            for (let i = 0; i < slides.length; i++) {
                // Navigate to slide (this will trigger re-render)
                setCurrentSlide(i)

                // Wait for slide to render
                await new Promise(resolve => setTimeout(resolve, 500))

                if (!fabricCanvasRef.current) continue

                // Export canvas as image
                const dataUrl = fabricCanvasRef.current.toDataURL({
                    format: 'png',
                    quality: 1,
                    multiplier: 2 // Higher resolution
                })

                // Add page if not first slide
                if (i > 0) {
                    pdf.addPage()
                }

                // Add image to PDF (full page)
                pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight)
            }

            // Restore original slide
            setCurrentSlide(currentSlideIndex)

            // Save PDF
            pdf.save('presentacion.pdf')
            toast.success('PDF exportado exitosamente')
        } catch (error) {
            console.error('Error exporting to PDF:', error)
            toast.error('Error al exportar a PDF')
        }
    }

    // Export to PPT
    const handleExportToPPT = async () => {
        if (!fabricCanvasRef.current || slides.length === 0) {
            toast.error('No hay slides para exportar')
            return
        }

        try {
            toast.loading('Exportando a PowerPoint...')

            const pptx = new PptxGenJS()

            // Set presentation size to 16:9
            pptx.layout = 'LAYOUT_16x9'
            pptx.author = 'Astri'
            pptx.title = 'Presentación'

            // Save current slide
            const currentSlideIndex = currentSlide

            // Export each slide
            for (let i = 0; i < slides.length; i++) {
                // Navigate to slide (this will trigger re-render)
                setCurrentSlide(i)

                // Wait for slide to render
                await new Promise(resolve => setTimeout(resolve, 500))

                if (!fabricCanvasRef.current) continue

                // Export canvas as image
                const dataUrl = fabricCanvasRef.current.toDataURL({
                    format: 'png',
                    quality: 1,
                    multiplier: 2 // Higher resolution
                })

                // Add slide to presentation
                const slide = pptx.addSlide()

                // Add image to fill entire slide
                slide.addImage({
                    data: dataUrl,
                    x: 0,
                    y: 0,
                    w: '100%',
                    h: '100%'
                })
            }

            // Restore original slide
            setCurrentSlide(currentSlideIndex)

            // Save PowerPoint
            await pptx.writeFile({ fileName: 'presentacion.pptx' })
            toast.success('PowerPoint exportado exitosamente')
        } catch (error) {
            console.error('Error exporting to PowerPoint:', error)
            toast.error('Error al exportar a PowerPoint')
        }
    }

    if (!files || isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-900">
                <div className="flex flex-col items-center gap-2 text-white">
                    <Loader />
                    <p>Cargando presentación...</p>
                </div>
            </div>
        )
    }

    if (slides.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-900">
                <div className="text-white text-center p-8">
                    <p className="text-xl mb-4">No se encontraron slides</p>
                    <p className="text-sm text-gray-400">
                        Asegúrate de que la IA haya generado archivos en /slides/
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div ref={fullscreenRef} className="h-full w-full flex bg-zinc-950 relative">
            {/* Thumbnails Sidebar */}
            {showThumbnails && !isFullscreen && (
                <div className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Slides</h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setShowThumbnails(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                            {slides.map((slide, index) => (
                                <div
                                    key={index}
                                    onClick={() => {
                                        setIsTransitioning(true)
                                        setTimeout(() => {
                                            setCurrentSlide(index)
                                            setTimeout(() => setIsTransitioning(false), 300)
                                        }, 150)
                                    }}
                                    className={`
                                        relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
                                        ${index === currentSlide
                                            ? 'border-blue-500 ring-2 ring-blue-500/30'
                                            : 'border-zinc-700 hover:border-zinc-600'
                                        }
                                    `}
                                >
                                    <div
                                        className="aspect-video flex items-center justify-center text-xs font-medium"
                                        style={{ backgroundColor: slide.background || '#ffffff' }}
                                    >
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                                            <span className="text-white text-xs font-bold">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <span className="text-zinc-400 text-xs">
                                            {slide.objects?.length || 0} {slide.objects?.length === 1 ? 'objeto' : 'objetos'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-zinc-800 text-xs text-zinc-400">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">←</kbd>
                                <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">→</kbd>
                                <span>Navegar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">F</kbd>
                                <span>Pantalla completa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">T</kbd>
                                <span>Miniaturas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">Ctrl +</kbd>
                                <span>Zoom in</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">Ctrl -</kbd>
                                <span>Zoom out</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-zinc-800 rounded text-[10px]">Ctrl 0</kbd>
                                <span>Reset zoom</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Top Control Bar */}
                {!isFullscreen && (
                    <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-50">
                        <div className="flex items-center gap-3">
                            {!showThumbnails && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowThumbnails(true)}
                                    className="h-8"
                                >
                                    <Grid3x3 className="size-4 mr-2" />
                                    Miniaturas
                                </Button>
                            )}
                            <div className="h-6 w-px bg-zinc-700" />
                            <span className="text-sm text-zinc-400">
                                Slide <span className="text-white font-semibold">{currentSlide + 1}</span> de {slides.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Export Controls */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportToPDF}
                                className="h-8"
                                title="Exportar a PDF"
                            >
                                <FileDown className="size-4 mr-2" />
                                PDF
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportToPPT}
                                className="h-8"
                                title="Exportar a PowerPoint"
                            >
                                <FileDown className="size-4 mr-2" />
                                PPT
                            </Button>

                            <div className="h-6 w-px bg-zinc-700" />

                            {/* Zoom Controls */}
                            <div className="flex items-center gap-1 border border-zinc-700 rounded-lg px-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleZoomOut}
                                    disabled={zoomLevel <= 0.25}
                                    className="h-7 w-7"
                                    title="Alejar (Ctrl -)"
                                >
                                    <ZoomOut className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomReset}
                                    className="h-7 px-2 text-xs font-medium min-w-[50px]"
                                    title="Restablecer zoom (Ctrl 0)"
                                >
                                    {Math.round(zoomLevel * 100)}%
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleZoomIn}
                                    disabled={zoomLevel >= 3}
                                    className="h-7 w-7"
                                    title="Acercar (Ctrl +)"
                                >
                                    <ZoomIn className="size-4" />
                                </Button>
                            </div>

                            <div className="h-6 w-px bg-zinc-700" />

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleFullscreen}
                                className="h-8"
                            >
                                <Maximize className="size-4 mr-2" />
                                Pantalla Completa
                            </Button>
                        </div>
                    </div>
                )}

                {/* Canvas Container */}
                <div
                    ref={containerRef}
                    className={`
                        flex-1 relative flex items-start justify-center bg-zinc-900 overflow-auto p-4 pb-24
                        transition-opacity duration-300
                        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
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
                        className="shadow-2xl rounded-sm flex-shrink-0"
                        style={{
                            display: 'block',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                    />
                </div>

                {/* Navigation Controls - Always visible */}
                <div className={`
                    absolute bottom-8 left-1/2 transform -translate-x-1/2
                    flex items-center gap-3 bg-black/80 backdrop-blur-xl rounded-full px-6 py-3
                    shadow-2xl border border-white/10
                `}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPreviousSlide}
                        disabled={currentSlide === 0}
                        className="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="size-6" />
                    </Button>

                    {/* Progress indicators */}
                    <div className="flex items-center gap-1.5 px-3">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setIsTransitioning(true)
                                    setTimeout(() => {
                                        setCurrentSlide(index)
                                        setTimeout(() => setIsTransitioning(false), 300)
                                    }, 150)
                                }}
                                className={`
                                    h-2 rounded-full transition-all
                                    ${index === currentSlide
                                        ? 'w-8 bg-blue-500'
                                        : 'w-2 bg-white/30 hover:bg-white/50'
                                    }
                                `}
                                aria-label={`Ir al slide ${index + 1}`}
                            />
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextSlide}
                        disabled={currentSlide === slides.length - 1}
                        className="h-10 w-10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="size-6" />
                    </Button>

                    {/* Divider */}
                    <div className="h-8 w-px bg-white/20" />

                    {/* Export Controls */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportToPDF}
                        className="h-9 text-white hover:bg-white/20 px-3"
                        title="Exportar a PDF"
                    >
                        <FileDown className="size-4 mr-2" />
                        PDF
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportToPPT}
                        className="h-9 text-white hover:bg-white/20 px-3"
                        title="Exportar a PowerPoint"
                    >
                        <FileDown className="size-4 mr-2" />
                        PPT
                    </Button>
                </div>

                {/* Fullscreen Exit Button */}
                {isFullscreen && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/20 bg-black/50 backdrop-blur-sm rounded-full"
                    >
                        <Minimize className="size-5" />
                    </Button>
                )}

                {/* Slide Counter and Zoom in Fullscreen */}
                {isFullscreen && (
                    <>
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                            <span className="text-white text-sm font-medium">
                                {currentSlide + 1} / {slides.length}
                            </span>
                        </div>

                        {/* Zoom controls in fullscreen */}
                        <div className="absolute top-4 right-16 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomOut}
                                disabled={zoomLevel <= 0.25}
                                className="h-8 w-8 text-white hover:bg-white/20"
                                title="Alejar (Ctrl -)"
                            >
                                <ZoomOut className="size-4" />
                            </Button>
                            <span className="text-white text-xs font-medium px-2 min-w-[45px] text-center">
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomIn}
                                disabled={zoomLevel >= 3}
                                className="h-8 w-8 text-white hover:bg-white/20"
                                title="Acercar (Ctrl +)"
                            >
                                <ZoomIn className="size-4" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
