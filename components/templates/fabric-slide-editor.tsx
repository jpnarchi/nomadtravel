'use client'

/**
 * Editor de Slides con Fabric.js - REFACTORIZADO
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'
import { toast } from 'sonner'

// Utilities
import {
    createText, createRectangle, createCircle, createTriangle, createRing,
    updateRingThickness, createLine, addImageToCanvas, createImagePlaceholder,
    replaceImagePlaceholderWithImage
} from './fabric-editor/shape-factory'
import {
    serializeCanvas, copyObjectToJSON, pasteObjectFromJSON, updateObjectProperty,
    updateObjectFillColor, toggleObjectLock, bringObjectToFront, sendObjectToBack,
    bringObjectForward, sendObjectBackward, zoomIn, zoomOut, resetZoom
} from './fabric-editor/canvas-utils'

// Components
import { ToolsSidebar } from './fabric-editor/tools-sidebar'
import { PropertiesSidebar } from './fabric-editor/properties-sidebar'
import { EditorToolbar } from './fabric-editor/editor-toolbar'
import { UploadButtonDialog } from "./fabric-editor/image-upload-button"

// Hooks
import { useFabricCanvas } from './hooks/use-fabric-canvas'
import { useCanvasHistory } from './hooks/use-canvas-history'
import { useCanvasKeyboard } from './hooks/use-canvas-keyboard'
import { useImageUpload } from './hooks/use-image-upload'

// Types
import { AspectRatioType, DEFAULT_ASPECT_RATIO, getAspectRatioDimensions } from '@/lib/aspect-ratios'

interface FabricSlideEditorProps {
    slideData: any
    onSlideChange: (slideData: any) => void
    slideNumber: number
    totalSlides: number
    onCopyObject: (objectData: any) => void
    onPasteObject: () => any
    isSidebarCollapsed?: boolean
    onToggleSidebar?: () => void
    aspectRatio?: AspectRatioType
}

export function FabricSlideEditor({
    slideData,
    onSlideChange,
    slideNumber,
    totalSlides,
    onCopyObject,
    onPasteObject,
    isSidebarCollapsed,
    onToggleSidebar,
    aspectRatio = DEFAULT_ASPECT_RATIO
}: FabricSlideEditorProps) {
    const aspectRatioDimensions = getAspectRatioDimensions(aspectRatio)

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const saveCanvasRef = useRef<() => void>(() => {})

    // State
    const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
    const [backgroundColor, setBackgroundColor] = useState(slideData?.background || '#ffffff')
    const [zoom, setZoom] = useState(1)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [selectedPlaceholder, setSelectedPlaceholder] = useState<fabric.FabricObject | null>(null)

    // Custom hooks
    const { isUploading, uploadImage, uploadFromClipboard } = useImageUpload()
    const {
        saveStateToHistory,
        undo,
        redo,
        completeInitialLoad,
        isInitialLoadRef
    } = useCanvasHistory(backgroundColor)

    // Canvas setup with event handlers
    const setupCanvasEvents = useCallback((canvas: fabric.Canvas) => {
        // Selection events
        canvas.on('selection:created', (e) => {
            const obj = e.selected?.[0] || null
            setSelectedObject(obj)
            if (obj && (obj as any).isImagePlaceholder) {
                setSelectedPlaceholder(obj)
            } else {
                setSelectedPlaceholder(null)
            }
        })

        canvas.on('selection:updated', (e) => {
            const obj = e.selected?.[0] || null
            setSelectedObject(obj)
            if (obj && (obj as any).isImagePlaceholder) {
                setSelectedPlaceholder(obj)
            } else {
                setSelectedPlaceholder(null)
            }
        })

        canvas.on('selection:cleared', () => {
            setSelectedObject(null)
            setSelectedPlaceholder(null)
        })

        // Double click to load image into placeholder
        canvas.on('mouse:dblclick', (e) => {
            const target = e.target
            if (target && (target as any).isImagePlaceholder) {
                setSelectedPlaceholder(target)
                setShowUploadDialog(true)
            }
        })

        // Auto-save on changes
        let saveTimeout: NodeJS.Timeout | null = null
        let isInitialLoad = true

        const debouncedSave = () => {
            if (isInitialLoad) return
            if (saveTimeout) clearTimeout(saveTimeout)
            saveTimeout = setTimeout(() => saveCanvas(), 500)
        }

        setTimeout(() => { isInitialLoad = false }, 1500)

        canvas.on('object:modified', () => {
            saveStateToHistory(canvas)
            debouncedSave()
        })
        canvas.on('object:added', () => {
            if (!isInitialLoad) {
                saveStateToHistory(canvas)
                debouncedSave()
            }
        })
        canvas.on('object:removed', () => {
            saveStateToHistory(canvas)
            debouncedSave()
        })
        canvas.on('object:scaling', debouncedSave)
        canvas.on('object:rotating', debouncedSave)
        canvas.on('object:moving', debouncedSave)
        canvas.on('text:changed', () => {
            if (!isInitialLoad) debouncedSave()
        })
        canvas.on('text:editing:exited', () => {
            if (!isInitialLoad) {
                saveStateToHistory(canvas)
                debouncedSave()
            }
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
    }, [])

    const { fabricCanvasRef, baseScaleRef } = useFabricCanvas({
        canvasRef,
        containerRef,
        slideData,
        slideNumber,
        backgroundColor,
        aspectRatio,
        onCanvasEvents: setupCanvasEvents
    })

    // Complete initial load and save first state
    useEffect(() => {
        setTimeout(() => {
            completeInitialLoad()
            if (fabricCanvasRef.current) {
                saveStateToHistory(fabricCanvasRef.current)
            }
        }, 1500)
    }, [])

    // Save canvas function
    const saveCanvas = useCallback(() => {
        if (isInitialLoadRef.current || !fabricCanvasRef.current) return

        const slideJSON = serializeCanvas(fabricCanvasRef.current, backgroundColor)
        onSlideChange(slideJSON)
    }, [fabricCanvasRef, backgroundColor, onSlideChange, isInitialLoadRef])

    // Update saveCanvasRef
    useEffect(() => {
        saveCanvasRef.current = saveCanvas
    }, [saveCanvas])

    // Background color effect
    useEffect(() => {
        if (fabricCanvasRef.current && !isInitialLoadRef.current) {
            fabricCanvasRef.current.backgroundColor = backgroundColor
            fabricCanvasRef.current.renderAll()
            saveStateToHistory(fabricCanvasRef.current)
            saveCanvas()
        }
    }, [backgroundColor])

    // Shape creation handlers
    const handleAddText = () => {
        if (!fabricCanvasRef.current) return
        isInitialLoadRef.current = false
        createText(fabricCanvasRef.current)
    }

    const handleAddRectangle = () => fabricCanvasRef.current && createRectangle(fabricCanvasRef.current)
    const handleAddCircle = () => fabricCanvasRef.current && createCircle(fabricCanvasRef.current)
    const handleAddTriangle = () => fabricCanvasRef.current && createTriangle(fabricCanvasRef.current)
    const handleAddRing = () => fabricCanvasRef.current && createRing(fabricCanvasRef.current)
    const handleAddLine = () => fabricCanvasRef.current && createLine(fabricCanvasRef.current)
    const handleAddImagePlaceholder = async () => {
        if (fabricCanvasRef.current) await createImagePlaceholder(fabricCanvasRef.current)
    }

    // Image handlers
    const handleFileSelect = async (file: File) => {
        const url = await uploadImage(file)
        if (url) handleAddImage(url)
    }

    const handleAddImage = (imgSrc: string) => {
        if (!fabricCanvasRef.current) return

        if (selectedPlaceholder && (selectedPlaceholder as any).isImagePlaceholder) {
            replaceImagePlaceholderWithImage(fabricCanvasRef.current, selectedPlaceholder, imgSrc)
                .then(() => {
                    toast.success('Image added to container')
                    setSelectedPlaceholder(null)
                })
                .catch(() => toast.error('Error al cargar la imagen'))
        } else {
            addImageToCanvas(fabricCanvasRef.current, imgSrc)
                .then(() => toast.success('Image added'))
                .catch(() => toast.error('Error al cargar la imagen'))
        }
    }

    // Object operations
    const handleDeleteSelected = () => {
        if (!fabricCanvasRef.current) return

        const activeObjects = fabricCanvasRef.current.getActiveObjects()
        if (activeObjects.length === 0) return

        activeObjects.forEach(obj => fabricCanvasRef.current?.remove(obj))
        fabricCanvasRef.current.discardActiveObject()
        fabricCanvasRef.current.renderAll()
        setSelectedObject(null)
        saveCanvas()
        toast.success(`${activeObjects.length} object${activeObjects.length > 1 ? 's' : ''} deleted`)
    }

    const handleCopyObject = () => {
        if (!fabricCanvasRef.current) return

        const activeObjects = fabricCanvasRef.current.getActiveObjects()
        if (activeObjects.length === 0) {
            toast.error('No objects selected to copy')
            return
        }

        const objectsData = activeObjects.map(obj => {
            const data = copyObjectToJSON(obj)
            const matrix = obj.calcTransformMatrix()
            const decomposed = fabric.util.qrDecompose(matrix)
            data.left = decomposed.translateX
            data.top = decomposed.translateY
            return data
        })

        const dataToStore = objectsData.length === 1 ? objectsData[0] : objectsData
        onCopyObject(dataToStore)
    }

    const handlePasteObject = async () => {
        if (!fabricCanvasRef.current) return

        const copiedData = onPasteObject()
        if (!copiedData) {
            toast.error('No object to paste')
            return
        }

        try {
            const objectsToPaste = Array.isArray(copiedData) ? copiedData : [copiedData]

            let minLeft = Infinity, minTop = Infinity
            objectsToPaste.forEach(obj => {
                minLeft = Math.min(minLeft, obj.left || 0)
                minTop = Math.min(minTop, obj.top || 0)
            })

            const targetLeft = minLeft < 0 || minTop < 0 ? 960 : minLeft + 50
            const targetTop = minTop < 0 || minTop < 0 ? 540 : minTop + 50
            const offsetX = targetLeft - minLeft
            const offsetY = targetTop - minTop

            const pastedObjects: fabric.FabricObject[] = []
            for (const objData of objectsToPaste) {
                const offsetObjData = {
                    ...objData,
                    left: objData.left + offsetX,
                    top: objData.top + offsetY
                }
                const pastedObj = await pasteObjectFromJSON(fabricCanvasRef.current, offsetObjData)
                if (pastedObj) pastedObjects.push(pastedObj)
            }

            if (pastedObjects.length > 0) {
                if (pastedObjects.length === 1) {
                    fabricCanvasRef.current.setActiveObject(pastedObjects[0])
                } else {
                    fabricCanvasRef.current.discardActiveObject()
                }
                fabricCanvasRef.current.renderAll()
            }

            setTimeout(() => {
                isInitialLoadRef.current = false
                saveCanvas()
            }, 50)

            toast.success(`${pastedObjects.length} object${pastedObjects.length > 1 ? 's' : ''} pasted`)
        } catch (error) {
            console.error('Error pasting objects:', error)
            toast.error('Error pasting object')
        }
    }

    const handleToggleLock = () => {
        if (!fabricCanvasRef.current || !selectedObject) return
        const isLocked = toggleObjectLock(selectedObject, fabricCanvasRef.current)
        saveCanvas()
        toast.success(isLocked ? 'Object blocked' : 'Object unblocked')
    }

    // Property updates
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

    const handleUpdateStrokeColor = (color: string) => {
        if (!selectedObject || !fabricCanvasRef.current) return
        selectedObject.set({ stroke: color })
        fabricCanvasRef.current.renderAll()
        saveCanvas()
    }

    const handleUpdateStrokeWidth = (width: number) => {
        if (!selectedObject || !fabricCanvasRef.current) return
        selectedObject.set({ strokeWidth: width })
        fabricCanvasRef.current.renderAll()
        saveCanvas()
    }

    const handleUpdateRingThickness = (thickness: number) => {
        if (!selectedObject || !fabricCanvasRef.current) return
        if ((selectedObject as any).isRing) {
            updateRingThickness(selectedObject, thickness)
            fabricCanvasRef.current.renderAll()
            saveCanvas()
        }
    }

    const handleUpdateBorderRadius = (radius: number) => {
        if (!selectedObject || !fabricCanvasRef.current) return
        ;(selectedObject as any).borderRadius = radius

        if ((selectedObject as any).isImagePlaceholder && selectedObject.type === 'group') {
            const group = selectedObject as fabric.Group
            group.getObjects().forEach(obj => {
                if (obj.type === 'rect') {
                    (obj as fabric.Rect).set({ rx: radius, ry: radius })
                }
            })
            group.setCoords()
            fabricCanvasRef.current.renderAll()
        }

        if ((selectedObject as any).isImageContainer && selectedObject.type === 'image') {
            const img = selectedObject as fabric.FabricImage
            const scale = img.scaleX || 1

            if (radius > 0) {
                const clipBorderRadius = radius / scale
                const clipPath = new fabric.Rect({
                    width: img.width! - ((img as any).cropX * 2),
                    height: img.height! - ((img as any).cropY * 2),
                    rx: clipBorderRadius,
                    ry: clipBorderRadius,
                    left: -(img.width! - ((img as any).cropX * 2)) / 2,
                    top: -(img.height! - ((img as any).cropY * 2)) / 2,
                    originX: 'left',
                    originY: 'top',
                })
                img.set({ clipPath })
            } else {
                img.set({ clipPath: undefined })
            }
            fabricCanvasRef.current.renderAll()
        }

        saveCanvas()
    }

    // Layer controls
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

    // Zoom controls
    const handleZoomIn = () => {
        if (!fabricCanvasRef.current) return
        const newZoom = zoomIn(fabricCanvasRef.current, zoom, baseScaleRef.current, aspectRatioDimensions.width, aspectRatioDimensions.height)
        setZoom(newZoom)
    }

    const handleZoomOut = () => {
        if (!fabricCanvasRef.current) return
        const newZoom = zoomOut(fabricCanvasRef.current, zoom, baseScaleRef.current, aspectRatioDimensions.width, aspectRatioDimensions.height)
        setZoom(newZoom)
    }

    const handleFitToScreen = () => {
        if (!fabricCanvasRef.current) return
        const newZoom = resetZoom(fabricCanvasRef.current, baseScaleRef.current, aspectRatioDimensions.width, aspectRatioDimensions.height)
        setZoom(newZoom)
    }

    // Keyboard shortcuts
    useCanvasKeyboard({
        fabricCanvasRef,
        onCopy: handleCopyObject,
        onPaste: handlePasteObject,
        onDelete: handleDeleteSelected,
        onUndo: () => undo(fabricCanvasRef.current, setBackgroundColor),
        onRedo: () => redo(fabricCanvasRef.current, setBackgroundColor)
    })

    // Clipboard paste
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile()
                    if (!blob) continue

                    e.preventDefault()
                    const url = await uploadFromClipboard(blob)
                    if (url) {
                        handleAddImage(url)
                        toast.success('Imagen paste')
                    }
                    break
                }
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [])

    // Global image addition events
    useEffect(() => {
        const handleGlobalImageAdd = (e: Event) => {
            const customEvent = e as CustomEvent
            const { imageUrl, slideIndex } = customEvent.detail

            if (slideIndex === slideNumber - 1 && fabricCanvasRef.current) {
                addImageToCanvas(fabricCanvasRef.current, imageUrl)
                    .then(() => toast.success('Image added'))
                    .catch(() => toast.error('Error al cargar la imagen.'))
            }
        }

        window.addEventListener('addImageToSlide', handleGlobalImageAdd)
        return () => window.removeEventListener('addImageToSlide', handleGlobalImageAdd)
    }, [slideNumber])

    return (
        <div className="h-full flex">
            <ToolsSidebar
                onAddText={handleAddText}
                onAddRectangle={handleAddRectangle}
                onAddCircle={handleAddCircle}
                onAddTriangle={handleAddTriangle}
                onAddRing={handleAddRing}
                onAddLine={handleAddLine}
                onFileSelect={handleFileSelect}
                onShowUploadDialog={() => setShowUploadDialog(true)}
                onAddImagePlaceholder={handleAddImagePlaceholder}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={onToggleSidebar}
            />

            <div className="flex-1 min-w-0 flex flex-col">
                <EditorToolbar
                    slideNumber={slideNumber}
                    totalSlides={totalSlides}
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
                    onUndo={() => undo(fabricCanvasRef.current, setBackgroundColor)}
                    onRedo={() => redo(fabricCanvasRef.current, setBackgroundColor)}
                />

                <div
                    ref={containerRef}
                    className="flex-1 bg-gray-200 flex items-start justify-center overflow-auto relative p-4"
                    style={{
                        backgroundImage: "url('/img/background.svg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'fixed'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="shadow-2xl border-2 border-gray-400 rounded-sm flex-shrink-0"
                        style={{ display: 'block' }}
                    />
                </div>
            </div>

            <PropertiesSidebar
                selectedObject={selectedObject}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                onUpdateTextProperty={handleUpdateTextProperty}
                onUpdateFillColor={handleUpdateFillColor}
                onUpdateBorderRadius={handleUpdateBorderRadius}
                onUpdateStrokeColor={handleUpdateStrokeColor}
                onUpdateStrokeWidth={handleUpdateStrokeWidth}
                onUpdateRingThickness={handleUpdateRingThickness}
            />

            <UploadButtonDialog
                open={showUploadDialog}
                onOpenChange={setShowUploadDialog}
                onUploadComplete={handleAddImage}
            />
        </div>
    )
}
