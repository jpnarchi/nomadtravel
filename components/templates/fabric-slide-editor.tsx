'use client'

/**
 * Editor de Slides con Fabric.js - REFACTORIZADO
 *
 * Componente para editar un slide individual usando Fabric.js canvas
 * Permite agregar texto, formas, imágenes y editar propiedades
 */

import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

// Import utilities and components
import { createText, createRectangle, createCircle, createTriangle, addImageToCanvas } from './fabric-editor/shape-factory'
import { loadObjectsToCanvas } from './fabric-editor/object-loader'
import {
    serializeCanvas,
    copyObjectToJSON,
    pasteObjectFromJSON,
    updateObjectProperty,
    updateObjectFillColor,
    toggleObjectLock,
    bringObjectToFront,
    sendObjectToBack,
    bringObjectForward,
    sendObjectBackward,
    zoomIn,
    zoomOut,
    resetZoom,
} from './fabric-editor/canvas-utils'
import { ToolsSidebar } from './fabric-editor/tools-sidebar'
import { PropertiesSidebar } from './fabric-editor/properties-sidebar'
import { EditorToolbar } from './fabric-editor/editor-toolbar'

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
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const saveCanvasRef = useRef<() => void>(() => {})
    const isInitialLoadRef = useRef(true)
    const baseScaleRef = useRef(1)
    const copiedObjectRef = useRef<any>(null)

    // State
    const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
    const [backgroundColor, setBackgroundColor] = useState(slideData?.background || '#ffffff')
    const [zoom, setZoom] = useState(1)
    const [showImageUrlDialog, setShowImageUrlDialog] = useState(false)
    const [imageUrl, setImageUrl] = useState('')

    // ============================================================================
    // SAVE CANVAS FUNCTION
    // ============================================================================
    const saveCanvas = () => {
        console.log('💾 saveCanvas llamado - isInitialLoad:', isInitialLoadRef.current)

        if (isInitialLoadRef.current) {
            console.log('⏭️ Saltando guardado - aún en carga inicial')
            return
        }

        if (!fabricCanvasRef.current) {
            console.log('❌ No hay canvas para guardar')
            return
        }

        const slideJSON = serializeCanvas(fabricCanvasRef.current, backgroundColor)

        console.log('💾 Guardando slide:', {
            slideNumber,
            objectCount: slideJSON.objects.length,
            background: backgroundColor,
        })

        console.log('🔄 Llamando onSlideChange con:', slideJSON)
        onSlideChange(slideJSON)
        console.log('✅ onSlideChange llamado exitosamente')
    }

    // Update ref
    useEffect(() => {
        saveCanvasRef.current = saveCanvas
    })

    // ============================================================================
    // INITIALIZE CANVAS
    // ============================================================================
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return

        const container = containerRef.current
        const containerWidth = container.clientWidth - 32
        const containerHeight = container.clientHeight - 32

        const scaleX = containerWidth / 1920
        const scaleY = containerHeight / 1080
        const scale = Math.min(scaleX, scaleY, 1)

        const displayWidth = 1920 * scale
        const displayHeight = 1080 * scale

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: displayWidth,
            height: displayHeight,
            backgroundColor: backgroundColor,
            selection: true,
            preserveObjectStacking: true,
        })

        canvas.setZoom(scale)
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0]
        setZoom(scale)
        baseScaleRef.current = scale

        fabricCanvasRef.current = canvas

        console.log('✅ Editor - Canvas initialized')

        // Load existing slide data
        loadObjectsToCanvas(canvas, slideData, slideNumber)

        // Setup event handlers
        setupCanvasEvents(canvas)

        // Mark initial load as complete after delay
        setTimeout(() => {
            isInitialLoadRef.current = false
            console.log('✅ Carga inicial completa, auto-guardado habilitado')
        }, 1500)

        // Handle resize
        const handleResize = () => {
            if (!canvasRef.current || !containerRef.current || !fabricCanvasRef.current) return

            const container = containerRef.current
            const containerWidth = container.clientWidth - 32
            const containerHeight = container.clientHeight - 32

            const scaleX = containerWidth / 1920
            const scaleY = containerHeight / 1080
            const newScale = Math.min(scaleX, scaleY, 1)

            const displayWidth = 1920 * newScale
            const displayHeight = 1080 * newScale

            fabricCanvasRef.current.setWidth(displayWidth)
            fabricCanvasRef.current.setHeight(displayHeight)
            fabricCanvasRef.current.setZoom(newScale)
            fabricCanvasRef.current.viewportTransform = [newScale, 0, 0, newScale, 0, 0]
            setZoom(newScale)
            baseScaleRef.current = newScale

            fabricCanvasRef.current.renderAll()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            if (fabricCanvasRef.current) {
                console.log('🧹 Limpiando canvas y guardando estado final...')
                saveCanvasRef.current()
            }
            canvas.dispose()
            window.removeEventListener('resize', handleResize)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ============================================================================
    // CANVAS EVENT HANDLERS
    // ============================================================================
    const setupCanvasEvents = (canvas: fabric.Canvas) => {
        // Selection events
        canvas.on('selection:created', (e) => {
            setSelectedObject(e.selected?.[0] || null)
        })

        canvas.on('selection:updated', (e) => {
            setSelectedObject(e.selected?.[0] || null)
        })

        canvas.on('selection:cleared', () => {
            setSelectedObject(null)
        })

        // Auto-save on changes
        let saveTimeout: NodeJS.Timeout | null = null
        let isInitialLoad = true

        const debouncedSave = () => {
            if (isInitialLoad) return
            if (saveTimeout) clearTimeout(saveTimeout)
            saveTimeout = setTimeout(() => {
                saveCanvas()
            }, 500)
        }

        setTimeout(() => {
            isInitialLoad = false
        }, 1500)

        canvas.on('object:modified', () => debouncedSave())
        canvas.on('object:added', (e) => {
            if (!isInitialLoad) debouncedSave()
        })
        canvas.on('object:removed', () => debouncedSave())
        canvas.on('object:scaling', () => debouncedSave())
        canvas.on('object:rotating', () => debouncedSave())
        canvas.on('object:moving', () => debouncedSave())
        canvas.on('text:changed', (e) => {
            if (!isInitialLoad) debouncedSave()
        })
        canvas.on('text:editing:exited', (e) => {
            if (!isInitialLoad) debouncedSave()
        })

        // Zoom with mouse wheel
        canvas.on('mouse:wheel', (opt) => {
            const event = opt.e as WheelEvent
            const delta = event.deltaY
            let newZoom = canvas.getZoom()
            newZoom *= 0.999 ** delta

            if (newZoom > 5) newZoom = 5
            if (newZoom < 0.1) newZoom = 0.1

            canvas.zoomToPoint(
                { x: event.offsetX, y: event.offsetY } as any,
                newZoom
            )
            setZoom(newZoom)
            event.preventDefault()
            event.stopPropagation()
        })

        // Panning
        let lastPosX = 0
        let lastPosY = 0
        let isDragging = false

        canvas.on('mouse:down', (opt) => {
            const evt = opt.e as MouseEvent
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
    }

    // ============================================================================
    // BACKGROUND COLOR EFFECT
    // ============================================================================
    useEffect(() => {
        if (fabricCanvasRef.current && !isInitialLoadRef.current) {
            fabricCanvasRef.current.backgroundColor = backgroundColor
            fabricCanvasRef.current.renderAll()
            saveCanvas()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor])

    // ============================================================================
    // SHAPE CREATION HANDLERS
    // ============================================================================
    const handleAddText = () => {
        if (!fabricCanvasRef.current) return
        isInitialLoadRef.current = false
        createText(fabricCanvasRef.current)
        toast.success('Texto agregado - Escribe para editar')
    }

    const handleAddRectangle = () => {
        if (!fabricCanvasRef.current) return
        createRectangle(fabricCanvasRef.current)
        toast.success('Rectángulo agregado')
    }

    const handleAddCircle = () => {
        if (!fabricCanvasRef.current) return
        createCircle(fabricCanvasRef.current)
        toast.success('Círculo agregado')
    }

    const handleAddTriangle = () => {
        if (!fabricCanvasRef.current) return
        createTriangle(fabricCanvasRef.current)
        toast.success('Triángulo agregado')
    }

    // ============================================================================
    // IMAGE HANDLERS
    // ============================================================================
    const handleFileSelect = (file: File) => {
        if (!fabricCanvasRef.current) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const imgUrl = event.target?.result as string
            handleAddImage(imgUrl)
        }
        reader.readAsDataURL(file)
    }

    const handleAddImageFromUrl = () => {
        if (!imageUrl.trim()) {
            toast.error('Por favor ingresa una URL válida')
            return
        }
        handleAddImage(imageUrl)
        setShowImageUrlDialog(false)
        setImageUrl('')
    }

    const handleAddImage = (imgSrc: string) => {
        if (!fabricCanvasRef.current) return

        addImageToCanvas(fabricCanvasRef.current, imgSrc)
            .then(() => toast.success('Imagen agregada'))
            .catch(() => toast.error('Error al cargar la imagen. Verifica la URL.'))
    }

    // ============================================================================
    // OBJECT OPERATIONS
    // ============================================================================
    const handleDeleteSelected = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        fabricCanvasRef.current.remove(selectedObject)
        fabricCanvasRef.current.renderAll()
        setSelectedObject(null)
        toast.success('Objeto eliminado')
    }

    const handleCopyObject = () => {
        if (!selectedObject) return
        copiedObjectRef.current = copyObjectToJSON(selectedObject)
        toast.success('Objeto copiado')
    }

    const handlePasteObject = async () => {
        if (!fabricCanvasRef.current || !copiedObjectRef.current) return

        try {
            await pasteObjectFromJSON(fabricCanvasRef.current, copiedObjectRef.current)
            toast.success('Objeto pegado')
        } catch (error) {
            toast.error('Error al pegar objeto')
        }
    }

    const handleToggleLock = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        const isLocked = toggleObjectLock(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        toast.success(isLocked ? 'Objeto bloqueado' : 'Objeto desbloqueado')
    }

    // ============================================================================
    // PROPERTY UPDATES
    // ============================================================================
    const handleUpdateTextProperty = (property: string, value: any) => {
        if (!selectedObject || !fabricCanvasRef.current) return
        updateObjectProperty(selectedObject, property, value, fabricCanvasRef.current)
        saveCanvas()
    }

    const handleUpdateFillColor = (color: string) => {
        if (!selectedObject || !fabricCanvasRef.current) return
        updateObjectFillColor(selectedObject, color, fabricCanvasRef.current)
        saveCanvas()
    }

    // ============================================================================
    // LAYER CONTROLS
    // ============================================================================
    const handleBringToFront = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        bringObjectToFront(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        toast.success('Objeto movido al frente')
    }

    const handleSendToBack = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        sendObjectToBack(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        toast.success('Objeto movido al fondo')
    }

    const handleBringForward = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        bringObjectForward(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        toast.success('Objeto movido hacia adelante')
    }

    const handleSendBackward = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        sendObjectBackward(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        toast.success('Objeto movido hacia atrás')
    }

    // ============================================================================
    // ZOOM CONTROLS
    // ============================================================================
    const handleZoomIn = () => {
        if (!fabricCanvasRef.current) return
        const newZoom = zoomIn(fabricCanvasRef.current, zoom)
        setZoom(newZoom)
    }

    const handleZoomOut = () => {
        if (!fabricCanvasRef.current) return
        const newZoom = zoomOut(fabricCanvasRef.current, zoom)
        setZoom(newZoom)
    }

    const handleFitToScreen = () => {
        if (!fabricCanvasRef.current) return
        const newZoom = resetZoom(fabricCanvasRef.current, baseScaleRef.current)
        setZoom(newZoom)
    }

    // ============================================================================
    // KEYBOARD SHORTCUTS
    // ============================================================================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement
            const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

            if (fabricCanvasRef.current) {
                const activeObject = fabricCanvasRef.current.getActiveObject()
                if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox') && (activeObject as any).isEditing) {
                    return
                }
            }

            if (isTextInput) return

            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                e.preventDefault()
                handleCopyObject()
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                e.preventDefault()
                handlePasteObject()
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && !isTextInput) {
                e.preventDefault()
                handleDeleteSelected()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedObject])

    // ============================================================================
    // CLIPBOARD & DRAG-DROP
    // ============================================================================
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
                        handleAddImage(imgUrl)
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
                handleAddImage(imgUrl)
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

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <div className="h-full flex">
            {/* Left Sidebar - Tools */}
            <ToolsSidebar
                onAddText={handleAddText}
                onAddRectangle={handleAddRectangle}
                onAddCircle={handleAddCircle}
                onAddTriangle={handleAddTriangle}
                onFileSelect={handleFileSelect}
                onShowImageUrlDialog={() => setShowImageUrlDialog(true)}
            />

            {/* Center - Canvas Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Toolbar */}
                <EditorToolbar
                    slideNumber={slideNumber}
                    zoom={zoom}
                    selectedObject={selectedObject}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitToScreen={handleFitToScreen}
                    onBringToFront={handleBringToFront}
                    onBringForward={handleBringForward}
                    onSendBackward={handleSendBackward}
                    onSendToBack={handleSendToBack}
                    onToggleLock={handleToggleLock}
                    onDelete={handleDeleteSelected}
                />

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
            <PropertiesSidebar
                selectedObject={selectedObject}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                onUpdateTextProperty={handleUpdateTextProperty}
                onUpdateFillColor={handleUpdateFillColor}
            />

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
