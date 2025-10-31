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
    Scan,
    Lock,
    Unlock,
    ArrowUp,
    ArrowDown,
    ChevronsUp,
    ChevronsDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify
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
    const copiedObjectRef = useRef<any>(null) // Store copied object for clipboard

    // Save canvas function
    const saveCanvas = () => {
        console.log('💾 saveCanvas llamado - isInitialLoad:', isInitialLoadRef.current)

        // Skip saving during initial load
        if (isInitialLoadRef.current) {
            console.log('⏭️ Saltando guardado - aún en carga inicial')
            return
        }

        if (!fabricCanvasRef.current) {
            console.log('❌ No hay canvas para guardar')
            return
        }

        const canvas = fabricCanvasRef.current

        // Export all objects with their complete state
        const objects = canvas.getObjects().map((obj, index) => {
            // Include all necessary properties for serialization
            // @ts-expect-error - fabric.js toJSON accepts propertiesToInclude array
            const json = obj.toJSON([
                'selectable',
                'evented',
                'hasControls',
                'hasBorders',
                'lockScalingFlip',
                'crossOrigin',
                'lockMovementX',
                'lockMovementY',
                'lockRotation',
                'lockScalingX',
                'lockScalingY',
                // Text-specific properties
                'text',
                'fontSize',
                'fontFamily',
                'fontWeight',
                'fontStyle',
                'textAlign',
                'lineHeight',
                'charSpacing',
                'styles',
                'editable',
                'width' // Include width for Textbox objects (text wrapping)
            ])

            // Add z-index to preserve layer order
            json.zIndex = index

            // Log text objects specifically
            if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
                console.log('📝 Serializando texto:', {
                    type: obj.type,
                    text: (obj as any).text,
                    fontSize: (obj as any).fontSize,
                    zIndex: index,
                    json: json
                })
            }

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
            objects: objects.map(obj => ({
                type: obj.type,
                left: obj.left,
                top: obj.top,
                text: obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox' ? (obj as any).text : undefined
            }))
        })

        console.log('🔄 Llamando onSlideChange con:', slideJSON)
        onSlideChange(slideJSON)
        console.log('✅ onSlideChange llamado exitosamente')
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

            // Sort objects by zIndex to preserve layer order
            const sortedObjects = [...slideData.objects].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            console.log(`🔢 Objetos ordenados por zIndex:`, sortedObjects.map((obj, i) => ({
                type: obj.type,
                zIndex: obj.zIndex,
                position: i
            })))

            // Load all objects asynchronously to preserve layer order
            const loadObjects = async () => {
                const objectPromises = sortedObjects.map(async (obj: any, index: number) => {
                    console.log(`🔍 Procesando objeto ${index}:`, obj)

                    try {
                        const objType = (obj.type || '').toLowerCase()
                        let fabricObj: fabric.FabricObject | null = null

                        switch (objType) {
                            case 'text':
                            case 'i-text':
                            case 'itext':  // IText se normaliza a 'itext' sin guión
                            case 'textbox':
                                console.log(`📝 Creando texto: "${obj.text}"`)
                                // Use Textbox if width is defined, otherwise use IText for backward compatibility
                                if (obj.width) {
                                    fabricObj = new fabric.Textbox(obj.text || 'Text', {
                                        left: obj.left,
                                        top: obj.top,
                                        width: obj.width, // Preserve width for text wrapping
                                        fontSize: obj.fontSize || 40,
                                        fill: obj.fill || '#000000',
                                        fontFamily: obj.fontFamily || 'Arial',
                                        fontWeight: obj.fontWeight || 'normal',
                                        textAlign: obj.textAlign || 'left',
                                    })
                                } else {
                                    fabricObj = new fabric.IText(obj.text || 'Text', {
                                        left: obj.left,
                                        top: obj.top,
                                        fontSize: obj.fontSize || 40,
                                        fill: obj.fill || '#000000',
                                        fontFamily: obj.fontFamily || 'Arial',
                                        fontWeight: obj.fontWeight || 'normal',
                                        textAlign: obj.textAlign || 'left',
                                    })
                                }
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
                                        const img = await fabric.FabricImage.fromURL(obj.src)
                                        if (obj.left !== undefined) img.set('left', obj.left)
                                        if (obj.top !== undefined) img.set('top', obj.top)
                                        if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
                                        if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
                                        if (obj.angle !== undefined) img.set('angle', obj.angle)
                                        img.set({
                                            selectable: obj.lockMovementX ? true : true,
                                            evented: obj.lockMovementX ? true : true,
                                            hasControls: obj.lockMovementX ? false : true,
                                            hasBorders: true,
                                            lockScalingFlip: true,
                                            lockMovementX: obj.lockMovementX || false,
                                            lockMovementY: obj.lockMovementY || false,
                                            lockRotation: obj.lockRotation || false,
                                            lockScalingX: obj.lockScalingX || false,
                                            lockScalingY: obj.lockScalingY || false,
                                        })
                                        fabricObj = img
                                        console.log(`✅ Imagen ${index} cargada`,
                                            obj.lockMovementX ? '🔒 bloqueado' : '')
                                    } catch (err) {
                                        console.error(`❌ Error cargando imagen ${index}:`, err)
                                        return null
                                    }
                                }
                                break
                            default:
                                console.warn(`⚠️ Tipo de objeto desconocido: ${obj.type} (normalizado: ${objType})`)
                                return null
                        }

                        if (fabricObj) {
                            // Apply saved lock properties or default to unlocked
                            fabricObj.set({
                                selectable: obj.lockMovementX ? true : true,
                                evented: obj.lockMovementX ? true : true,
                                hasControls: obj.lockMovementX ? false : true,
                                hasBorders: true,
                                lockScalingFlip: true,
                                lockMovementX: obj.lockMovementX || false,
                                lockMovementY: obj.lockMovementY || false,
                                lockRotation: obj.lockRotation || false,
                                lockScalingX: obj.lockScalingX || false,
                                lockScalingY: obj.lockScalingY || false,
                            })
                            console.log(`✅ Objeto ${index} creado: ${obj.type} en (${obj.left}, ${obj.top})`,
                                obj.lockMovementX ? '🔒 bloqueado' : '')
                            return fabricObj
                        }
                        return null
                    } catch (error) {
                        console.error(`❌ Error al crear objeto ${index}:`, error, obj)
                        return null
                    }
                })

                // Wait for all objects to be created
                const loadedObjects = await Promise.all(objectPromises)

                // Add objects to canvas in the correct order
                loadedObjects.forEach((fabricObj, index) => {
                    if (fabricObj) {
                        canvas.add(fabricObj)
                        console.log(`✅ Objeto ${index} agregado al canvas en orden`)
                    }
                })

                canvas.renderAll()
                console.log(`✅ Slide ${slideNumber} cargado completamente con ${canvas.getObjects().length} objetos en el orden correcto`)
            }

            // Execute async loading
            loadObjects()
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
        const initialObjectCount = canvas.getObjects().length

        const debouncedSave = () => {
            console.log('⏱️ debouncedSave llamado - isInitialLoad:', isInitialLoad)

            // Skip saving during initial load
            if (isInitialLoad) {
                console.log('⏭️ Saltando guardado durante carga inicial (debouncedSave)')
                return
            }

            if (saveTimeout) clearTimeout(saveTimeout)
            saveTimeout = setTimeout(() => {
                console.log('⏰ Ejecutando guardado después del debounce')
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

        canvas.on('object:modified', () => {
            console.log('🔄 Evento: object:modified')
            debouncedSave()
        })
        // Don't save on object:added during initial load
        canvas.on('object:added', (e) => {
            console.log('➕ Evento: object:added', e.target?.type, 'isInitialLoad:', isInitialLoad)
            if (!isInitialLoad) debouncedSave()
        })
        canvas.on('object:removed', () => {
            console.log('➖ Evento: object:removed')
            debouncedSave()
        })
        canvas.on('object:scaling', () => {
            console.log('📏 Evento: object:scaling')
            debouncedSave()
        })
        canvas.on('object:rotating', () => {
            console.log('🔄 Evento: object:rotating')
            debouncedSave()
        })
        canvas.on('object:moving', () => {
            console.log('🚚 Evento: object:moving')
            debouncedSave()
        })
        // Text editing events - crucial for saving text content changes
        canvas.on('text:changed', (e) => {
            console.log('📝 Evento: text:changed', (e.target as any)?.text, 'isInitialLoad:', isInitialLoad)
            if (!isInitialLoad) {
                console.log('📝 Texto cambiado, guardando...')
                debouncedSave()
            }
        })
        canvas.on('text:editing:exited', (e) => {
            console.log('📝 Evento: text:editing:exited', (e.target as any)?.text, 'isInitialLoad:', isInitialLoad)
            if (!isInitialLoad) {
                console.log('📝 Edición de texto finalizada, guardando...')
                debouncedSave()
            }
        })

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
                { x: event.offsetX, y: event.offsetY } as any,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Update background color
    useEffect(() => {
        if (fabricCanvasRef.current && !isInitialLoadRef.current) {
            fabricCanvasRef.current.backgroundColor = backgroundColor
            fabricCanvasRef.current.renderAll()
            saveCanvas()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor])

    // Add text
    const addText = () => {
        if (!fabricCanvasRef.current) return

        console.log('➕ addText llamado - isInitialLoad:', isInitialLoadRef.current)

        // User is actively adding text, so initial load is complete
        isInitialLoadRef.current = false
        console.log('✅ Marcando carga inicial como completa (usuario agregó texto)')

        // Use Textbox instead of IText to enable automatic text wrapping
        const text = new fabric.Textbox('Haz clic para editar', {
            left: 100,
            top: 100,
            width: 800, // Define width for text wrapping
            fontSize: 60,
            fill: '#ffffff',
            fontFamily: 'Arial',
            editable: true,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })

        console.log('📝 Texto creado:', text.type, text.text)

        fabricCanvasRef.current.add(text)
        fabricCanvasRef.current.setActiveObject(text)

        // Listen for when editing is done to save
        text.on('editing:exited', () => {
            console.log('📝 [Listener del texto] Edición finalizada:', text.text)
            setTimeout(() => {
                console.log('📝 [Listener del texto] Guardando después de 100ms...')
                // Force save the canvas - bypass isInitialLoad check temporarily
                const canvas = fabricCanvasRef.current
                if (!canvas) return

                const objects = canvas.getObjects().map(obj => {
                    // @ts-expect-error - fabric.js toJSON accepts propertiesToInclude array
                    const json = obj.toJSON([
                        'selectable', 'evented', 'hasControls', 'hasBorders',
                        'lockScalingFlip', 'crossOrigin',
                        'lockMovementX', 'lockMovementY', 'lockRotation',
                        'lockScalingX', 'lockScalingY',
                        'text', 'fontSize', 'fontFamily', 'fontWeight',
                        'fontStyle', 'textAlign', 'lineHeight',
                        'charSpacing', 'styles', 'editable', 'width'
                    ])
                    return json
                })

                const slideJSON = {
                    version: '5.3.0',
                    objects: objects,
                    background: backgroundColor
                }

                console.log('💾 [Listener del texto] Guardando con', objects.length, 'objetos')
                onSlideChange(slideJSON)
            }, 100)
        })

        // Also listen for text changes
        text.on('changed', () => {
            console.log('📝 [Listener del texto] Texto cambiado:', text.text)
        })

        console.log('📝 Listeners agregados al texto')

        // Enter editing mode immediately
        text.enterEditing()
        text.selectAll()
        fabricCanvasRef.current.renderAll()
        toast.success('Texto agregado - Escribe para editar')

        console.log('📝 Texto agregado al canvas y en modo de edición')
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

    // Copy selected object
    const copyObject = () => {
        if (!selectedObject) {
            console.log('❌ No hay objeto seleccionado para copiar')
            return
        }

        // Serialize the object with all its properties
        // @ts-expect-error - fabric.js toJSON accepts propertiesToInclude array
        const objectData = selectedObject.toJSON([
            'selectable', 'evented', 'hasControls', 'hasBorders',
            'lockScalingFlip', 'crossOrigin',
            'lockMovementX', 'lockMovementY', 'lockRotation',
            'lockScalingX', 'lockScalingY',
            'text', 'fontSize', 'fontFamily', 'fontWeight',
            'fontStyle', 'textAlign', 'lineHeight',
            'charSpacing', 'styles', 'editable', 'width'
        ])

        copiedObjectRef.current = objectData
        console.log('📋 Objeto copiado:', objectData)
        toast.success('Objeto copiado')
    }

    // Paste object
    const pasteObject = async () => {
        if (!fabricCanvasRef.current || !copiedObjectRef.current) {
            console.log('❌ No hay objeto en el portapapeles')
            return
        }

        const canvas = fabricCanvasRef.current
        const objData = copiedObjectRef.current

        try {
            let newObj: fabric.FabricObject | null = null
            const objType = (objData.type || '').toLowerCase()

            console.log('📋 Pegando objeto tipo:', objType, objData)

            switch (objType) {
                case 'text':
                case 'i-text':
                case 'itext':
                case 'textbox':
                    // Use Textbox if width is defined, otherwise use IText
                    if (objData.width) {
                        newObj = new fabric.Textbox(objData.text || 'Text', {
                            left: objData.left + 20,
                            top: objData.top + 20,
                            width: objData.width,
                            fontSize: objData.fontSize,
                            fill: objData.fill,
                            fontFamily: objData.fontFamily,
                            fontWeight: objData.fontWeight,
                            fontStyle: objData.fontStyle,
                            textAlign: objData.textAlign,
                            lineHeight: objData.lineHeight,
                            charSpacing: objData.charSpacing,
                            angle: objData.angle || 0,
                            scaleX: objData.scaleX || 1,
                            scaleY: objData.scaleY || 1,
                            originX: objData.originX,
                            originY: objData.originY,
                        })
                    } else {
                        newObj = new fabric.IText(objData.text || 'Text', {
                            left: objData.left + 20,
                            top: objData.top + 20,
                            fontSize: objData.fontSize,
                            fill: objData.fill,
                            fontFamily: objData.fontFamily,
                            fontWeight: objData.fontWeight,
                            fontStyle: objData.fontStyle,
                            textAlign: objData.textAlign,
                            lineHeight: objData.lineHeight,
                            charSpacing: objData.charSpacing,
                            angle: objData.angle || 0,
                            scaleX: objData.scaleX || 1,
                            scaleY: objData.scaleY || 1,
                            originX: objData.originX,
                            originY: objData.originY,
                        })
                    }
                    break
                case 'rect':
                case 'rectangle':
                    newObj = new fabric.Rect({
                        left: objData.left + 20,
                        top: objData.top + 20,
                        width: objData.width,
                        height: objData.height,
                        fill: objData.fill,
                        stroke: objData.stroke,
                        strokeWidth: objData.strokeWidth,
                        rx: objData.rx,
                        ry: objData.ry,
                        angle: objData.angle,
                        scaleX: objData.scaleX,
                        scaleY: objData.scaleY,
                    })
                    break
                case 'circle':
                    newObj = new fabric.Circle({
                        left: objData.left + 20,
                        top: objData.top + 20,
                        radius: objData.radius,
                        fill: objData.fill,
                        stroke: objData.stroke,
                        strokeWidth: objData.strokeWidth,
                        angle: objData.angle,
                        scaleX: objData.scaleX,
                        scaleY: objData.scaleY,
                    })
                    break
                case 'triangle':
                    newObj = new fabric.Triangle({
                        left: objData.left + 20,
                        top: objData.top + 20,
                        width: objData.width,
                        height: objData.height,
                        fill: objData.fill,
                        stroke: objData.stroke,
                        strokeWidth: objData.strokeWidth,
                        angle: objData.angle,
                        scaleX: objData.scaleX,
                        scaleY: objData.scaleY,
                    })
                    break
                case 'line':
                    newObj = new fabric.Line([objData.x1, objData.y1, objData.x2, objData.y2], {
                        left: objData.left + 20,
                        top: objData.top + 20,
                        stroke: objData.stroke,
                        strokeWidth: objData.strokeWidth,
                    })
                    break
                case 'image':
                    if (objData.src) {
                        const img = await fabric.FabricImage.fromURL(objData.src)
                        img.set({
                            left: objData.left + 20,
                            top: objData.top + 20,
                            scaleX: objData.scaleX,
                            scaleY: objData.scaleY,
                            angle: objData.angle,
                        })
                        newObj = img
                    }
                    break
                default:
                    console.warn('⚠️ Tipo de objeto no soportado para pegar:', objType)
                    return
            }

            if (newObj) {
                // Apply common properties
                newObj.set({
                    selectable: true,
                    evented: true,
                    hasControls: true,
                    hasBorders: true,
                })

                canvas.add(newObj)
                canvas.setActiveObject(newObj)
                canvas.renderAll()

                console.log('✅ Objeto pegado')
                toast.success('Objeto pegado')
            }
        } catch (error) {
            console.error('❌ Error al pegar objeto:', error)
            toast.error('Error al pegar objeto')
        }
    }

    // Toggle lock/unlock selected object
    const toggleLockObject = () => {
        if (!fabricCanvasRef.current || !selectedObject) return

        const isLocked = selectedObject.lockMovementX || selectedObject.lockMovementY

        if (isLocked) {
            // Unlock object
            selectedObject.set({
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false,
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
            })
            toast.success('Objeto desbloqueado')
        } else {
            // Lock object
            selectedObject.set({
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                hasControls: false,
            })
            toast.success('Objeto bloqueado')
        }

        fabricCanvasRef.current.renderAll()
        saveCanvas()
    }

    // Change text properties
    const updateTextProperty = (property: string, value: any) => {
        if (!selectedObject) return
        const isTextType = selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox'
        if (!isTextType) return

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

    // Layer controls
    const bringToFront = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        fabricCanvasRef.current.bringObjectToFront(selectedObject)
        fabricCanvasRef.current.renderAll()
        saveCanvas()
        toast.success('Objeto movido al frente')
    }

    const sendToBack = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        fabricCanvasRef.current.sendObjectToBack(selectedObject)
        fabricCanvasRef.current.renderAll()
        saveCanvas()
        toast.success('Objeto movido al fondo')
    }

    const bringForward = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        fabricCanvasRef.current.bringObjectForward(selectedObject)
        fabricCanvasRef.current.renderAll()
        saveCanvas()
        toast.success('Objeto movido hacia adelante')
    }

    const sendBackward = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        fabricCanvasRef.current.sendObjectBackwards(selectedObject)
        fabricCanvasRef.current.renderAll()
        saveCanvas()
        toast.success('Objeto movido hacia atrás')
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

    // Handle keyboard shortcuts for copy/paste
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in a text field
            const target = e.target as HTMLElement
            const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

            // If editing text on canvas, don't trigger shortcuts
            if (fabricCanvasRef.current) {
                const activeObject = fabricCanvasRef.current.getActiveObject()
                if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox') && (activeObject as any).isEditing) {
                    return // User is editing text, don't intercept
                }
            }

            // Don't trigger if typing in input fields
            if (isTextInput) return

            // Cmd/Ctrl + C: Copy
            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                e.preventDefault()
                copyObject()
            }

            // Cmd/Ctrl + V: Paste
            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                e.preventDefault()
                pasteObject()
            }

            // Delete/Backspace: Delete selected object
            if ((e.key === 'Delete' || e.key === 'Backspace') && !isTextInput) {
                e.preventDefault()
                deleteSelected()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedObject])

    return (
        <div className="h-full flex">
            {/* Left Sidebar - Tools */}
            <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={addText}
                    className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                    title="Agregar Texto"
                >
                    <Type className="size-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={addRectangle}
                    className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                    title="Agregar Rectángulo"
                >
                    <Square className="size-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={addCircle}
                    className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                    title="Agregar Círculo"
                >
                    <Circle className="size-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={addTriangle}
                    className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                    title="Agregar Triángulo"
                >
                    <Triangle className="size-5" />
                </Button>

                <div className="h-px w-8 bg-zinc-700 my-2" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                    title="Subir Imagen"
                >
                    <Upload className="size-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowImageUrlDialog(true)}
                    className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                    title="Imagen desde URL"
                >
                    <ImageIcon className="size-5" />
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Center - Canvas Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Toolbar */}
                <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
                    <h3 className="text-sm font-semibold text-white">Slide {slideNumber}</h3>

                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-md">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomOut}
                                className="h-7 w-7 text-white hover:text-black"
                                title="Alejar"
                            >
                                <ZoomOut className="size-3.5" />
                            </Button>
                            <span className="text-white text-xs min-w-[45px] text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomIn}
                                className="h-7 w-7 text-white hover:text-black"
                                title="Acercar"
                            >
                                <ZoomIn className="size-3.5" />
                            </Button>
                            <div className="h-4 w-px bg-zinc-600 mx-0.5" />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fitToScreen}
                                className="h-7 w-7 text-white hover:text-black"
                                title="Ajustar"
                            >
                                <Scan className="size-3.5" />
                            </Button>
                        </div>

                        {/* Object Actions */}
                        {selectedObject && (
                            <div className="flex items-center gap-1">
                                {/* Layer Controls */}
                                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-zinc-800 rounded-md">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={bringToFront}
                                        className="h-7 w-7 text-white hover:text-black"
                                        title="Traer al frente"
                                    >
                                        <ChevronsUp className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={bringForward}
                                        className="h-7 w-7 text-white hover:text-black"
                                        title="Traer adelante"
                                    >
                                        <ArrowUp className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={sendBackward}
                                        className="h-7 w-7 text-white hover:text-black"
                                        title="Enviar atrás"
                                    >
                                        <ArrowDown className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={sendToBack}
                                        className="h-7 w-7 text-white hover:text-black"
                                        title="Enviar al fondo"
                                    >
                                        <ChevronsDown className="size-3.5" />
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleLockObject}
                                    className="h-8 w-8 text-white hover:text-black"
                                    title={selectedObject.lockMovementX ? 'Desbloquear' : 'Bloquear'}
                                >
                                    {selectedObject.lockMovementX ? (
                                        <Unlock className="size-4" />
                                    ) : (
                                        <Lock className="size-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={deleteSelected}
                                    className="h-8 w-8 text-white hover:text-black hover:bg-red-500/10"
                                    title="Eliminar"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-zinc-800 flex items-center justify-center overflow-hidden relative"
                >
                    <canvas
                        ref={canvasRef}
                        className="shadow-2xl border-2 border-zinc-600 rounded-sm"
                        style={{
                            display: 'block',
                            margin: '0 auto',
                        }}
                    />
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1.5 rounded backdrop-blur-sm">
                        <p className="text-[10px] text-zinc-300">Shift+Arrastrar para mover | Rueda para zoom</p>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-64 bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {/* Slide Properties */}
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                        <h4 className="text-xs font-semibold text-white uppercase mb-3 tracking-wide">Slide</h4>
                        <div>
                            <Label className="text-xs text-zinc-300 mb-2 block font-medium">Color de fondo</Label>
                            <Input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="h-10 cursor-pointer bg-zinc-700 border-zinc-600 text-white"
                            />
                        </div>
                    </div>

                    {selectedObject && (
                        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                            <h4 className="text-xs font-semibold text-white uppercase mb-3 tracking-wide">
                                {selectedObject.type === 'i-text' || selectedObject.type === 'text' || selectedObject.type === 'textbox' ? 'Texto' :
                                 selectedObject.type === 'rect' ? 'Rectángulo' :
                                 selectedObject.type === 'circle' ? 'Círculo' :
                                 selectedObject.type === 'triangle' ? 'Triángulo' :
                                 selectedObject.type === 'image' ? 'Imagen' : 'Objeto'}
                            </h4>

                            {/* Text Properties */}
                            {(selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox') && (
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs text-zinc-300 mb-2 block font-medium">Tamaño</Label>
                                        <Input
                                            type="number"
                                            value={(selectedObject as any).fontSize || 60}
                                            onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                                            className="h-10 bg-zinc-700 border-zinc-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-zinc-300 mb-2 block font-medium">Color</Label>
                                        <Input
                                            type="color"
                                            value={(selectedObject as any).fill as string || '#ffffff'}
                                            onChange={(e) => updateFillColor(e.target.value)}
                                            className="h-10 cursor-pointer bg-zinc-700 border-zinc-600 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-zinc-300 mb-2 block font-medium">Fuente</Label>
                                        <Select
                                            value={(selectedObject as any).fontFamily || 'Arial'}
                                            onValueChange={(value) => updateTextProperty('fontFamily', value)}
                                        >
                                            <SelectTrigger className="h-10 bg-zinc-700 border-zinc-600 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                                <SelectItem value="Arial" className="text-white hover:bg-zinc-700">Arial</SelectItem>
                                                <SelectItem value="Times New Roman" className="text-white hover:bg-zinc-700">Times New Roman</SelectItem>
                                                <SelectItem value="Courier New" className="text-white hover:bg-zinc-700">Courier New</SelectItem>
                                                <SelectItem value="Georgia" className="text-white hover:bg-zinc-700">Georgia</SelectItem>
                                                <SelectItem value="Verdana" className="text-white hover:bg-zinc-700">Verdana</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-zinc-300 mb-2 block font-medium">Peso</Label>
                                        <Select
                                            value={(selectedObject as any).fontWeight || 'normal'}
                                            onValueChange={(value) => updateTextProperty('fontWeight', value)}
                                        >
                                            <SelectTrigger className="h-10 bg-zinc-700 border-zinc-600 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                                <SelectItem value="normal" className="text-white hover:bg-zinc-700">Normal</SelectItem>
                                                <SelectItem value="bold" className="text-white hover:bg-zinc-700">Negrita</SelectItem>
                                                <SelectItem value="100" className="text-white hover:bg-zinc-700">Thin</SelectItem>
                                                <SelectItem value="300" className="text-white hover:bg-zinc-700">Light</SelectItem>
                                                <SelectItem value="500" className="text-white hover:bg-zinc-700">Medium</SelectItem>
                                                <SelectItem value="700" className="text-white hover:bg-zinc-700">Bold</SelectItem>
                                                <SelectItem value="900" className="text-white hover:bg-zinc-700">Black</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-zinc-300 mb-2 block font-medium">Alineación</Label>
                                        <div className="grid grid-cols-4 gap-1">
                                            <Button
                                                variant={((selectedObject as any).textAlign || 'left') === 'left' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => updateTextProperty('textAlign', 'left')}
                                                className="h-10 text-black hover:text-black border-zinc-600"
                                                title="Alinear a la izquierda"
                                            >
                                                <AlignLeft className="size-4" />
                                            </Button>
                                            <Button
                                                variant={((selectedObject as any).textAlign || 'left') === 'center' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => updateTextProperty('textAlign', 'center')}
                                                className="h-10 text-black hover:text-black border-zinc-600"
                                                title="Centrar"
                                            >
                                                <AlignCenter className="size-4" />
                                            </Button>
                                            <Button
                                                variant={((selectedObject as any).textAlign || 'left') === 'right' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => updateTextProperty('textAlign', 'right')}
                                                className="h-10 text-black hover:text-black border-zinc-600"
                                                title="Alinear a la derecha"
                                            >
                                                <AlignRight className="size-4" />
                                            </Button>
                                            <Button
                                                variant={((selectedObject as any).textAlign || 'left') === 'justify' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => updateTextProperty('textAlign', 'justify')}
                                                className="h-10 text-black hover:text-black border-zinc-600"
                                                title="Justificar"
                                            >
                                                <AlignJustify className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Shape Fill Color */}
                            {selectedObject &&
                                selectedObject.type !== 'text' &&
                                selectedObject.type !== 'i-text' &&
                                selectedObject.type !== 'textbox' &&
                                selectedObject.type !== 'image' && (
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Color</Label>
                                    <Input
                                        type="color"
                                        value={(selectedObject as any).fill as string || '#667eea'}
                                        onChange={(e) => updateFillColor(e.target.value)}
                                        className="h-10 cursor-pointer bg-zinc-700 border-zinc-600 text-white"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {!selectedObject && (
                        <div className="text-center text-zinc-400 text-sm py-12 px-4">
                            <p className="leading-relaxed">Selecciona un objeto en el canvas para editar sus propiedades</p>
                        </div>
                    )}
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
