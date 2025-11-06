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
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

// Import utilities and components
import { createText, createRectangle, createCircle, createTriangle, createLine, addImageToCanvas } from './fabric-editor/shape-factory'
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
import {UploadButtonDialog} from "./fabric-editor/uploadthing-button"

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


    // Convex mutations
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const saveImage = useMutation(api.files.saveImage)

    // State
    const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
    const [backgroundColor, setBackgroundColor] = useState(slideData?.background || '#ffffff')
    const [zoom, setZoom] = useState(1)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

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
        
    }

    const handleAddRectangle = () => {
        if (!fabricCanvasRef.current) return
        createRectangle(fabricCanvasRef.current)
        
    }

    const handleAddCircle = () => {
        if (!fabricCanvasRef.current) return
        createCircle(fabricCanvasRef.current)
        
    }

    const handleAddTriangle = () => {
        if (!fabricCanvasRef.current) return
        createTriangle(fabricCanvasRef.current)
        
    }

    const handleAddLine = () => {
        if (!fabricCanvasRef.current) return
        createLine(fabricCanvasRef.current)
        
    }

    // ============================================================================
    // IMAGE HANDLERS
    // ============================================================================
    const handleFileSelect = async (file: File) => {
        if (!fabricCanvasRef.current) return

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen')
            return
        }

        setIsUploading(true)
        toast.info('Adding image...')

        try {
            // Generate upload URL
            const uploadUrl = await generateUploadUrl()

            // Upload file to Convex storage
            const result = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!result.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await result.json()

            // Get the public URL from Convex
            const { url } = await saveImage({ storageId })

            // Add image to canvas
            handleAddImage(url)
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Error al subir la imagen')
        } finally {
            setIsUploading(false)
        }
    }

    const handleAddImage = (imgSrc: string) => {
        if (!fabricCanvasRef.current) return

        addImageToCanvas(fabricCanvasRef.current, imgSrc)
            .then(() => toast.success('Image added'))
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
        
    }

    const handleCopyObject = () => {
        if (!selectedObject) return
        copiedObjectRef.current = copyObjectToJSON(selectedObject)
        
    }

    const handlePasteObject = async () => {
        if (!fabricCanvasRef.current || !copiedObjectRef.current) return

        try {
            await pasteObjectFromJSON(fabricCanvasRef.current, copiedObjectRef.current)
        
        } catch (error) {
            toast.error('Error pasting object')
        }
    }

    const handleToggleLock = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        const isLocked = toggleObjectLock(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        toast.success(isLocked ? 'Object blocked' : 'Object unblocked')
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
        
    }

    const handleSendToBack = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        sendObjectToBack(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        
    }

    const handleBringForward = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        bringObjectForward(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        
    }

    const handleSendBackward = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        sendObjectBackward(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        
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
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile()
                    if (!blob) continue

                    e.preventDefault()

                    setIsUploading(true)
                    toast.info('Subiendo imagen desde portapapeles...')

                    try {
                        // Generate upload URL
                        const uploadUrl = await generateUploadUrl()

                        // Upload file to Convex storage
                        const result = await fetch(uploadUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': blob.type },
                            body: blob,
                        })

                        if (!result.ok) {
                            throw new Error('Failed to upload file')
                        }

                        const { storageId } = await result.json()

                        // Get the public URL from Convex
                        const { url } = await saveImage({ storageId })

                        // Add image to canvas
                        handleAddImage(url)
                        toast.success('Imagen paste')
                    } catch (error) {
                        console.error('Error uploading pasted image:', error)
                        toast.error('Error al subir la imagen')
                    } finally {
                        setIsUploading(false)
                    }

                    break
                }
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Drag and drop is now handled globally by the parent FabricPresentationEditor
    // This component only listens for the global 'addImageToSlide' event

    // Listen for global image addition events from parent
    useEffect(() => {
        const handleGlobalImageAdd = (e: Event) => {
            const customEvent = e as CustomEvent
            const { imageUrl, slideIndex } = customEvent.detail

            // Only process if this is the current slide
            if (slideIndex === slideNumber - 1 && fabricCanvasRef.current) {
                addImageToCanvas(fabricCanvasRef.current, imageUrl)
                    .then(() => toast.success('Image added'))
                    .catch(() => toast.error('Error al cargar la imagen.'))
            }
        }

        window.addEventListener('addImageToSlide', handleGlobalImageAdd)

        return () => {
            window.removeEventListener('addImageToSlide', handleGlobalImageAdd)
        }
    }, [slideNumber])

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
                onAddLine={handleAddLine}
                onFileSelect={handleFileSelect}
                onShowUploadDialog={() => setShowUploadDialog(true)}
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
                        <p className="text-[10px] text-zinc-300">Shift+Drag to move | Wheel to zoom</p>
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

            {/* Image Upload Dialog */}
            <UploadButtonDialog
                open={showUploadDialog}
                onOpenChange={setShowUploadDialog}
                onUploadComplete={handleAddImage}
            />
        </div>
    )
}
