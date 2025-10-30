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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'

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
            // Get container dimensions with padding
            const container = containerRef.current
            const containerWidth = container.clientWidth - 64 // Account for p-8 (32px * 2)
            const containerHeight = container.clientHeight - 64

            console.log('📐 Preview - Dimensiones del contenedor:', { containerWidth, containerHeight })

            // Calculate scale to fit 1920x1080 in container
            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const scale = Math.min(scaleX, scaleY, 1)

            console.log('📐 Preview - Scale calculado:', { scaleX, scaleY, scale })

            // Calculate display dimensions
            const displayWidth = 1920 * scale
            const displayHeight = 1080 * scale

            console.log('📐 Preview - Dimensiones de display:', { displayWidth, displayHeight })

            // Initialize fabric canvas
            const canvas = new fabric.Canvas(canvasElement, {
                width: 1920,
                height: 1080,
                backgroundColor: '#1a1a1a',
                selection: false,
            })

            // Ensure zoom is at 1 (no zoom applied)
            canvas.setZoom(1)
            canvas.viewportTransform = [1, 0, 0, 1, 0, 0]

            // Apply CSS scaling
            canvasElement.style.width = `${displayWidth}px`
            canvasElement.style.height = `${displayHeight}px`

            fabricCanvasRef.current = canvas
            setCanvasReady(true)
            console.log('✅ Preview - Canvas de Fabric.js inicializado correctamente', {
                zoom: canvas.getZoom(),
                displayWidth,
                displayHeight
            })
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

        // Load objects from JSON
        if (slide.objects && Array.isArray(slide.objects)) {
            console.log(`📦 Cargando ${slide.objects.length} objetos`)
            slide.objects.forEach((obj: any, index: number) => {
                console.log(`🔸 Objeto ${index}:`, obj.type, obj)
                try {
                    // Create fabric object based on type
                    let fabricObj: fabric.FabricObject | null = null

                    // Normalize type to lowercase for comparison
                    const objType = (obj.type || '').toLowerCase()

                    switch (objType) {
                        case 'text':
                        case 'i-text':
                        case 'textbox':
                            console.log(`📝 Creando texto: "${obj.text}"`)
                            // Create text object with basic properties first
                            fabricObj = new fabric.Text(obj.text || 'Text', {
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
                                fabric.FabricImage.fromURL(obj.src).then((img) => {
                                    if (obj.left !== undefined) img.set('left', obj.left)
                                    if (obj.top !== undefined) img.set('top', obj.top)
                                    if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
                                    if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
                                    if (obj.angle !== undefined) img.set('angle', obj.angle)
                                    img.set({ selectable: false, evented: false })
                                    canvas.add(img)
                                    canvas.renderAll()
                                    console.log(`✅ Imagen ${index} agregada al canvas`)
                                }).catch((err) => {
                                    console.error('Error loading image:', err)
                                })
                            }
                            // Don't set fabricObj for async image loading
                            return
                        default:
                            console.warn(`Unknown object type: ${obj.type} (normalized: ${objType})`)
                            return
                    }

                    if (fabricObj) {
                        fabricObj.set({
                            selectable: false, // Disable selection in preview
                            evented: false, // Disable events in preview
                        })
                        canvas.add(fabricObj)
                        console.log(`✅ Objeto ${index} agregado al canvas`)
                    } else {
                        console.log(`⚠️ Objeto ${index} es null`)
                    }
                } catch (error) {
                    console.error('❌ Error creating fabric object:', error, obj)
                }
            })
        }

        console.log('🎨 Renderizando canvas...')
        canvas.renderAll()
        console.log('✅ Canvas renderizado. Objetos en canvas:', canvas.getObjects().length)
    }, [currentSlide, slides, canvasReady])

    // Handle window resize
    useEffect(() => {
        if (!canvasElement || !containerRef.current || !fabricCanvasRef.current) return

        const handleResize = () => {
            const container = containerRef.current
            if (!container || !canvasElement) return

            const containerWidth = container.clientWidth - 64 // Account for p-8
            const containerHeight = container.clientHeight - 64

            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const scale = Math.min(scaleX, scaleY, 1)

            const displayWidth = 1920 * scale
            const displayHeight = 1080 * scale

            canvasElement.style.width = `${displayWidth}px`
            canvasElement.style.height = `${displayHeight}px`

            console.log('🔄 Preview - Canvas resized:', { displayWidth, displayHeight })

            fabricCanvasRef.current?.renderAll()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [canvasElement])

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

    const goToNextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1)
        }
    }

    const goToPreviousSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1)
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-900 relative">
            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="relative flex items-center justify-center w-full h-full p-8"
            >
                <canvas
                    ref={(el) => {
                        if (el && !canvasElement) {
                            console.log('📍 Canvas element montado en el DOM:', el)
                            setCanvasElement(el)
                        }
                    }}
                    className="shadow-2xl border-2 border-zinc-700 rounded-sm"
                    style={{
                        display: 'block',
                        margin: '0 auto',
                    }}
                />
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/70 backdrop-blur-md rounded-full px-6 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousSlide}
                    disabled={currentSlide === 0}
                    className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                    <ChevronLeft className="size-6" />
                </Button>

                <span className="text-white font-medium min-w-[80px] text-center">
                    {currentSlide + 1} / {slides.length}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextSlide}
                    disabled={currentSlide === slides.length - 1}
                    className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                    <ChevronRight className="size-6" />
                </Button>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm">
                Usa las flechas del teclado o los botones para navegar
            </div>
        </div>
    )
}
