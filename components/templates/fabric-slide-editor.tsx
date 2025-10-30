'use client'

/**
 * Editor de Slides con Fabric.js
 *
 * Componente para editar un slide individual usando Fabric.js canvas
 * Permite agregar texto, formas, imágenes y editar propiedades
 */

import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
    Type,
    Square,
    Circle,
    Triangle,
    Image as ImageIcon,
    Trash2,
    Download,
    Plus,
    ZoomIn,
    ZoomOut,
    Maximize,
    Upload,
    Link,
    Scan
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface FabricSlideEditorProps {
    slideData: any
    onSlideChange: (slideData: any) => void
    slideNumber: number
}

export function FabricSlideEditor({
    slideData,
    onSlideChange,
    slideNumber
}: FabricSlideEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
    const [backgroundColor, setBackgroundColor] = useState(slideData?.background || '#ffffff')
    const [zoom, setZoom] = useState(1)
    const [isPanning, setIsPanning] = useState(false)
    const [showImageUrlDialog, setShowImageUrlDialog] = useState(false)
    const [imageUrl, setImageUrl] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const hasInitializedRef = useRef(false)
    const saveCanvasRef = useRef<() => void>(() => {})
    const isInitialLoadRef = useRef(true)
    const baseScaleRef = useRef(1) // Store the base scale for reset functionality

    // Save canvas function
    const saveCanvas = () => {
        // Skip saving during initial load
        if (isInitialLoadRef.current) {
            console.log('⏭️ Saltando guardado - aún en carga inicial')
            return
        }

        if (!fabricCanvasRef.current) return

        const canvas = fabricCanvasRef.current

        // Export all objects with their complete state
        const objects = canvas.getObjects().map(obj => {
            // Include all necessary properties for serialization
            const json = obj.toJSON([
                'selectable',
                'evented',
                'hasControls',
                'hasBorders',
                'lockScalingFlip',
                'crossOrigin'
            ])
            return json
        })

        const slideJSON = {
            version: '5.3.0',
            objects: objects,
            background: backgroundColor
        }

        console.log('💾 Guardando slide:', {
            slideNumber,
            objectCount: objects.length,
            background: backgroundColor,
            objects: objects.map(obj => ({ type: obj.type, left: obj.left, top: obj.top }))
        })

        onSlideChange(slideJSON)
    }

    // Update ref
    useEffect(() => {
        saveCanvasRef.current = saveCanvas
    })

    // Initialize Fabric.js canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return

        // Get container dimensions with padding (p-4 = 16px * 2 = 32px)
        const container = containerRef.current
        const containerWidth = container.clientWidth - 32 // Account for p-4 padding
        const containerHeight = container.clientHeight - 32

        console.log('📐 Editor - Container dimensions:', { containerWidth, containerHeight })

        // Calculate scale to fit 1920x1080 in container
        const scaleX = containerWidth / 1920
        const scaleY = containerHeight / 1080
        const scale = Math.min(scaleX, scaleY, 1)

        console.log('📐 Editor - Scale calculated:', { scaleX, scaleY, scale })

        // Set canvas display dimensions (scaled to fit)
        const displayWidth = 1920 * scale
        const displayHeight = 1080 * scale

        console.log('📐 Editor - Display dimensions:', { displayWidth, displayHeight })

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: displayWidth,  // Use scaled dimensions, not 1920
            height: displayHeight,  // Use scaled dimensions, not 1080
            backgroundColor: backgroundColor,
            selection: true,
            preserveObjectStacking: true,
        })

        // Set zoom to show content at correct scale
        canvas.setZoom(scale)
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0]
        setZoom(scale)
        baseScaleRef.current = scale // Store base scale for reset

        // No need for CSS scaling - canvas is already at correct size
        console.log('🎨 Canvas dimensions set:', {
            canvasWidth: canvas.getWidth(),
            canvasHeight: canvas.getHeight(),
            zoom: canvas.getZoom(),
            scale
        })

        fabricCanvasRef.current = canvas

        console.log('✅ Editor - Canvas initialized:', {
            canvasWidth: canvas.getWidth(),
            canvasHeight: canvas.getHeight(),
            zoom: canvas.getZoom(),
            displayWidth,
            displayHeight,
            backgroundColor
        })

        // Load existing slide data
        if (slideData && slideData.objects && Array.isArray(slideData.objects)) {
            console.log(`📥 Cargando ${slideData.objects.length} objetos en el slide ${slideNumber}`)
            console.log(`📋 Datos de slideData:`, slideData)

            slideData.objects.forEach((obj: any, index: number) => {
                console.log(`🔍 Procesando objeto ${index}:`, obj)
                let fabricObj: fabric.FabricObject | null = null

                try {
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
                                    img.set({
                                        selectable: true,
                                        evented: true,
                                        hasControls: true,
                                        hasBorders: true,
                                        lockScalingFlip: true,
                                    })
                                    canvas.add(img)
                                    canvas.renderAll()
                                    console.log(`✅ Imagen ${index} agregada al canvas`)
                                }).catch((err) => {
                                    console.error(`❌ Error cargando imagen ${index}:`, err)
                                })
                            }
                            // Don't set fabricObj for async image loading
                            return
                        default:
                            console.warn(`⚠️ Tipo de objeto desconocido: ${obj.type} (normalizado: ${objType})`)
                            return
                    }

                    if (fabricObj) {
                        // Ensure objects are selectable and moveable
                        fabricObj.set({
                            selectable: true,
                            evented: true,
                            hasControls: true,
                            hasBorders: true,
                            lockScalingFlip: true,
                        })
                        canvas.add(fabricObj)
                        console.log(`✅ Objeto ${index} agregado al canvas: ${obj.type} en (${obj.left}, ${obj.top})`)
                    } else {
                        console.error(`❌ No se pudo crear el objeto ${index}`, obj)
                    }
                } catch (error) {
                    console.error(`❌ Error al crear objeto ${index}:`, error, obj)
                }
            })
            canvas.renderAll()
            console.log(`✅ Slide ${slideNumber} cargado completamente con ${canvas.getObjects().length} objetos`)
        } else {
            console.log(`📭 Slide ${slideNumber} está vacío (sin objetos)`)
        }

        // Selection event
        canvas.on('selection:created', (e) => {
            setSelectedObject(e.selected?.[0] || null)
        })

        canvas.on('selection:updated', (e) => {
            setSelectedObject(e.selected?.[0] || null)
        })

        canvas.on('selection:cleared', () => {
            setSelectedObject(null)
        })

        // Auto-save on changes - use debounce to avoid too many saves
        // Only enable after initial load is complete
        let saveTimeout: NodeJS.Timeout | null = null
        let isInitialLoad = true
        let initialObjectCount = canvas.getObjects().length

        const debouncedSave = () => {
            // Skip saving during initial load
            if (isInitialLoad) {
                console.log('⏭️ Saltando guardado durante carga inicial')
                return
            }

            if (saveTimeout) clearTimeout(saveTimeout)
            saveTimeout = setTimeout(() => {
                saveCanvas()
            }, 500)
        }

        // Mark initial load as complete after a delay
        // Give time for all objects to be loaded
        setTimeout(() => {
            isInitialLoad = false
            isInitialLoadRef.current = false
            const currentObjectCount = canvas.getObjects().length
            console.log('✅ Carga inicial completa, auto-guardado habilitado', {
                initialObjects: initialObjectCount,
                currentObjects: currentObjectCount
            })
        }, 1500)

        canvas.on('object:modified', debouncedSave)
        // Don't save on object:added during initial load
        canvas.on('object:added', () => {
            if (!isInitialLoad) debouncedSave()
        })
        canvas.on('object:removed', debouncedSave)
        canvas.on('object:scaling', debouncedSave)
        canvas.on('object:rotating', debouncedSave)
        canvas.on('object:moving', debouncedSave)

        // Zoom with mouse wheel
        canvas.on('mouse:wheel', (opt) => {
            const event = opt.e as WheelEvent
            const delta = event.deltaY
            let newZoom = canvas.getZoom()
            newZoom *= 0.999 ** delta

            // Limit zoom
            if (newZoom > 5) newZoom = 5
            if (newZoom < 0.1) newZoom = 0.1

            // Zoom to mouse position
            canvas.zoomToPoint(
                { x: event.offsetX, y: event.offsetY },
                newZoom
            )
            setZoom(newZoom)
            event.preventDefault()
            event.stopPropagation()
        })

        // Panning with space + drag or middle mouse button
        let lastPosX = 0
        let lastPosY = 0
        let isDragging = false

        canvas.on('mouse:down', (opt) => {
            const evt = opt.e as MouseEvent
            // Space key + left click OR middle mouse button for panning
            if ((evt.button === 1) || (evt.button === 0 && evt.shiftKey)) {
                isDragging = true
                canvas.selection = false
                lastPosX = evt.clientX
                lastPosY = evt.clientY
                canvas.defaultCursor = 'grabbing'
            }
        })

        canvas.on('mouse:move', (opt) => {
            if (isDragging) {
                const evt = opt.e as MouseEvent
                const vpt = canvas.viewportTransform
                if (vpt) {
                    vpt[4] += evt.clientX - lastPosX
                    vpt[5] += evt.clientY - lastPosY
                    canvas.requestRenderAll()
                    lastPosX = evt.clientX
                    lastPosY = evt.clientY
                }
            }
        })

        canvas.on('mouse:up', () => {
            canvas.setViewportTransform(canvas.viewportTransform!)
            isDragging = false
            canvas.selection = true
            canvas.defaultCursor = 'default'
        })

        // Adjust canvas size on window resize
        const handleResize = () => {
            if (!canvasRef.current || !containerRef.current || !fabricCanvasRef.current) return

            const container = containerRef.current
            const containerWidth = container.clientWidth - 32 // Account for p-4 padding
            const containerHeight = container.clientHeight - 32

            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const newScale = Math.min(scaleX, scaleY, 1)

            const displayWidth = 1920 * newScale
            const displayHeight = 1080 * newScale

            // Update canvas dimensions and zoom
            fabricCanvasRef.current.setWidth(displayWidth)
            fabricCanvasRef.current.setHeight(displayHeight)
            fabricCanvasRef.current.setZoom(newScale)
            fabricCanvasRef.current.viewportTransform = [newScale, 0, 0, newScale, 0, 0]
            setZoom(newScale)
            baseScaleRef.current = newScale // Update base scale

            console.log('🔄 Editor - Canvas resized:', { displayWidth, displayHeight, zoom: newScale })

            fabricCanvasRef.current.renderAll()
        }
        window.addEventListener('resize', handleResize)

        hasInitializedRef.current = true

        return () => {
            // Save canvas state before disposing
            if (fabricCanvasRef.current) {
                console.log('🧹 Limpiando canvas y guardando estado final...')
                saveCanvasRef.current()
            }
            canvas.dispose()
            window.removeEventListener('resize', handleResize)
            hasInitializedRef.current = false
        }
    }, [])

    // Update background color
    useEffect(() => {
        if (fabricCanvasRef.current && !isInitialLoadRef.current) {
            fabricCanvasRef.current.backgroundColor = backgroundColor
            fabricCanvasRef.current.renderAll()
            saveCanvas()
        }
    }, [backgroundColor])

    // Add text
    const addText = () => {
        if (!fabricCanvasRef.current) return

        const text = new fabric.IText('Haz clic para editar', {
            left: 100,
            top: 100,
            fontSize: 60,
            fill: '#ffffff',
            fontFamily: 'Arial',
            editable: true,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })

        fabricCanvasRef.current.add(text)
        fabricCanvasRef.current.setActiveObject(text)
        // Enter editing mode immediately
        text.enterEditing()
        text.selectAll()
        fabricCanvasRef.current.renderAll()
        toast.success('Texto agregado - Escribe para editar')
    }

    // Add rectangle
    const addRectangle = () => {
        if (!fabricCanvasRef.current) return

        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            width: 400,
            height: 200,
            fill: '#667eea',
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })

        fabricCanvasRef.current.add(rect)
        fabricCanvasRef.current.setActiveObject(rect)
        fabricCanvasRef.current.renderAll()
        toast.success('Rectángulo agregado')
    }

    // Add circle
    const addCircle = () => {
        if (!fabricCanvasRef.current) return

        const circle = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 100,
            fill: '#51cf66',
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })

        fabricCanvasRef.current.add(circle)
        fabricCanvasRef.current.setActiveObject(circle)
        fabricCanvasRef.current.renderAll()
        toast.success('Círculo agregado')
    }

    // Add triangle
    const addTriangle = () => {
        if (!fabricCanvasRef.current) return

        const triangle = new fabric.Triangle({
            left: 100,
            top: 100,
            width: 200,
            height: 200,
            fill: '#ff6b6b',
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })

        fabricCanvasRef.current.add(triangle)
        fabricCanvasRef.current.setActiveObject(triangle)
        fabricCanvasRef.current.renderAll()
        toast.success('Triángulo agregado')
    }

    // Delete selected object
    const deleteSelected = () => {
        if (!fabricCanvasRef.current || !selectedObject) return

        fabricCanvasRef.current.remove(selectedObject)
        fabricCanvasRef.current.renderAll()
        setSelectedObject(null)
        toast.success('Objeto eliminado')
    }

    // Change text properties
    const updateTextProperty = (property: string, value: any) => {
        if (!selectedObject || selectedObject.type !== 'text') return

        selectedObject.set(property as any, value)
        fabricCanvasRef.current?.renderAll()
        saveCanvas()
    }

    // Change object fill color
    const updateFillColor = (color: string) => {
        if (!selectedObject) return

        selectedObject.set('fill', color)
        fabricCanvasRef.current?.renderAll()
        saveCanvas()
    }

    // Zoom controls
    const handleZoomIn = () => {
        if (!fabricCanvasRef.current) return
        const canvas = fabricCanvasRef.current
        let newZoom = canvas.getZoom() * 1.2
        if (newZoom > 5) newZoom = 5
        canvas.setZoom(newZoom)
        setZoom(newZoom)
        canvas.renderAll()
    }

    const handleZoomOut = () => {
        if (!fabricCanvasRef.current) return
        const canvas = fabricCanvasRef.current
        let newZoom = canvas.getZoom() / 1.2
        if (newZoom < 0.1) newZoom = 0.1
        canvas.setZoom(newZoom)
        setZoom(newZoom)
        canvas.renderAll()
    }

    const handleResetZoom = () => {
        if (!fabricCanvasRef.current) return
        const canvas = fabricCanvasRef.current
        const baseScale = baseScaleRef.current
        canvas.setZoom(baseScale)
        canvas.viewportTransform = [baseScale, 0, 0, baseScale, 0, 0]
        setZoom(baseScale)
        canvas.renderAll()
    }

    // Fit canvas to screen - resets zoom and viewport to show entire canvas
    const fitToScreen = () => {
        if (!fabricCanvasRef.current) return

        const canvas = fabricCanvasRef.current
        const baseScale = baseScaleRef.current

        // Reset zoom to base scale and center viewport
        canvas.setZoom(baseScale)
        canvas.viewportTransform = [baseScale, 0, 0, baseScale, 0, 0]
        setZoom(baseScale)
        canvas.renderAll()

        console.log('🎯 Canvas ajustado a pantalla:', {
            zoom: baseScale,
            canvasWidth: canvas.getWidth(),
            canvasHeight: canvas.getHeight()
        })
    }

    // Add image from file
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !fabricCanvasRef.current) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const imgUrl = event.target?.result as string
            addImageToCanvas(imgUrl)
        }
        reader.readAsDataURL(file)
    }

    // Add image from URL
    const handleAddImageFromUrl = () => {
        if (!imageUrl.trim()) {
            toast.error('Por favor ingresa una URL válida')
            return
        }
        addImageToCanvas(imageUrl)
        setShowImageUrlDialog(false)
        setImageUrl('')
    }

    // Add image to canvas
    const addImageToCanvas = (imgSrc: string) => {
        if (!fabricCanvasRef.current) return

        fabric.FabricImage.fromURL(imgSrc, {
            crossOrigin: 'anonymous'
        }).then((img) => {
            // Scale image to fit canvas if too large
            const maxWidth = 800
            const maxHeight = 600
            const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!, 1)

            img.set({
                left: 100,
                top: 100,
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
            })

            fabricCanvasRef.current!.add(img)
            fabricCanvasRef.current!.setActiveObject(img)
            fabricCanvasRef.current!.renderAll()
            toast.success('Imagen agregada')
        }).catch((err) => {
            console.error('Error loading image:', err)
            toast.error('Error al cargar la imagen. Verifica la URL.')
        })
    }

    // Handle paste from clipboard
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile()
                    if (!blob) continue

                    const reader = new FileReader()
                    reader.onload = (event) => {
                        const imgUrl = event.target?.result as string
                        addImageToCanvas(imgUrl)
                        toast.success('Imagen pegada desde el portapapeles')
                    }
                    reader.readAsDataURL(blob)
                    e.preventDefault()
                    break
                }
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [])

    // Handle drag and drop
    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleDrop = (e: DragEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const files = e.dataTransfer?.files
            if (!files || files.length === 0) return

            const file = files[0]
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor arrastra un archivo de imagen')
                return
            }

            const reader = new FileReader()
            reader.onload = (event) => {
                const imgUrl = event.target?.result as string
                addImageToCanvas(imgUrl)
                toast.success('Imagen agregada por drag & drop')
            }
            reader.readAsDataURL(file)
        }

        const canvas = canvasRef.current
        if (canvas) {
            canvas.addEventListener('dragover', handleDragOver)
            canvas.addEventListener('drop', handleDrop)
        }

        return () => {
            if (canvas) {
                canvas.removeEventListener('dragover', handleDragOver)
                canvas.removeEventListener('drop', handleDrop)
            }
        }
    }, [])

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="bg-zinc-900 border-b border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-white">Slide {slideNumber}</h3>
                </div>

                {/* Add objects toolbar */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addText}
                            className="flex items-center gap-2"
                        >
                            <Type className="size-4" />
                            Texto
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addRectangle}
                            className="flex items-center gap-2"
                        >
                            <Square className="size-4" />
                            Rectángulo
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addCircle}
                            className="flex items-center gap-2"
                        >
                            <Circle className="size-4" />
                            Círculo
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addTriangle}
                            className="flex items-center gap-2"
                        >
                            <Triangle className="size-4" />
                            Triángulo
                        </Button>
                        <div className="h-6 w-px bg-zinc-700 mx-1" />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                        >
                            <Upload className="size-4" />
                            Subir Imagen
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImageUrlDialog(true)}
                            className="flex items-center gap-2"
                        >
                            <Link className="size-4" />
                            URL
                        </Button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-1 px-3 py-1 bg-zinc-800 rounded-md">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomOut}
                                className="h-8 w-8"
                                title="Alejar (Zoom Out)"
                            >
                                <ZoomOut className="size-4" />
                            </Button>
                            <span className="text-white text-sm min-w-[60px] text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomIn}
                                className="h-8 w-8"
                                title="Acercar (Zoom In)"
                            >
                                <ZoomIn className="size-4" />
                            </Button>
                            <div className="h-6 w-px bg-zinc-600 mx-1" />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fitToScreen}
                                className="h-8 w-8"
                                title="Ajustar a la pantalla"
                            >
                                <Scan className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleResetZoom}
                                className="h-8 w-8"
                                title="Restablecer Zoom (100%)"
                            >
                                <Maximize className="size-4" />
                            </Button>
                        </div>
                        {selectedObject && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={deleteSelected}
                                className="flex items-center gap-2"
                            >
                                <Trash2 className="size-4" />
                                Eliminar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Properties panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <Label className="text-white mb-2">Fondo</Label>
                        <Input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="h-10 cursor-pointer"
                        />
                    </div>

                    {selectedObject && selectedObject.type === 'text' && (
                        <>
                            <div>
                                <Label className="text-white mb-2">Tamaño de fuente</Label>
                                <Input
                                    type="number"
                                    value={(selectedObject as any).fontSize || 60}
                                    onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                                    className="h-10"
                                />
                            </div>
                            <div>
                                <Label className="text-white mb-2">Color de texto</Label>
                                <Input
                                    type="color"
                                    value={(selectedObject as any).fill as string || '#ffffff'}
                                    onChange={(e) => updateFillColor(e.target.value)}
                                    className="h-10 cursor-pointer"
                                />
                            </div>
                            <div>
                                <Label className="text-white mb-2">Fuente</Label>
                                <Select
                                    value={(selectedObject as any).fontFamily || 'Arial'}
                                    onValueChange={(value) => updateTextProperty('fontFamily', value)}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Arial">Arial</SelectItem>
                                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                        <SelectItem value="Courier New">Courier New</SelectItem>
                                        <SelectItem value="Georgia">Georgia</SelectItem>
                                        <SelectItem value="Verdana">Verdana</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {selectedObject && selectedObject.type !== 'text' && selectedObject.type !== 'image' && (
                        <div>
                            <Label className="text-white mb-2">Color de relleno</Label>
                            <Input
                                type="color"
                                value={(selectedObject as any).fill as string || '#667eea'}
                                onChange={(e) => updateFillColor(e.target.value)}
                                className="h-10 cursor-pointer"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="flex-1 bg-zinc-800 flex items-center justify-center overflow-hidden relative p-4"
            >
                <canvas
                    ref={canvasRef}
                    className="shadow-2xl border-2 border-zinc-600 rounded-sm"
                    style={{
                        display: 'block',
                        margin: '0 auto',
                    }}
                />
                <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm">
                    <p className="mb-1">🖱️ <strong>Rueda del mouse:</strong> Zoom</p>
                    <p className="mb-1">⌨️ <strong>Shift + Arrastrar:</strong> Mover vista</p>
                    <p className="mb-1">🖱️ <strong>Botón central:</strong> Mover vista</p>
                    <p className="mb-1">📋 <strong>Ctrl+V:</strong> Pegar imagen</p>
                    <p>🎯 <strong>Arrastrar archivo:</strong> Soltar imagen</p>
                </div>
            </div>

            {/* Image URL Dialog */}
            <Dialog open={showImageUrlDialog} onOpenChange={setShowImageUrlDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Imagen desde URL</DialogTitle>
                        <DialogDescription>
                            Ingresa la URL de una imagen para agregarla al slide
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2">URL de la Imagen</Label>
                        <Input
                            type="url"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddImageFromUrl()
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowImageUrlDialog(false)
                                setImageUrl('')
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleAddImageFromUrl}>
                            Agregar Imagen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
