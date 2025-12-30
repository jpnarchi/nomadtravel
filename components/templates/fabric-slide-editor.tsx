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
    replaceImagePlaceholderWithImage, createTextFlexbox, updateFlexboxProperty,
    addTextToFlexbox, removeTextFromFlexbox, layoutFlexbox
} from './fabric-editor/shape-factory'
import {
    serializeCanvas, copyObjectToJSON, pasteObjectFromJSON, updateObjectProperty,
    updateObjectFillColor, toggleObjectLock, bringObjectToFront, sendObjectToBack,
    bringObjectForward, sendObjectBackward, zoomIn, zoomOut, resetZoom, zoomToPoint
} from './fabric-editor/canvas-utils'

// Components
import { ToolsSidebar } from './fabric-editor/tools-sidebar'
import { PropertiesSidebar } from './fabric-editor/properties-sidebar'
import { EditorToolbar } from './fabric-editor/editor-toolbar'
import { UploadButtonDialog } from "./fabric-editor/image-upload-button"

// Hooks
import { useFabricCanvas } from './hooks/use-fabric-canvas'
import { useObjectHistory } from './hooks/use-object-history'
import { useCanvasKeyboard } from './hooks/use-canvas-keyboard'
import { useImageUpload } from './hooks/use-image-upload'
import { useAlignmentGuides } from './hooks/use-alignment-guides'

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
        saveObjectModification,
        saveObjectAddition,
        saveObjectRemoval,
        saveBackgroundChange,
        undo,
        redo,
        completeInitialLoad,
        isInitialLoadRef,
        isUndoRedoRef,
        syncObjectMap,
        getObjectId,
        serializeObject,
        clearHistory,
        getHistoryInfo
    } = useObjectHistory(backgroundColor)
    const { setupAlignmentGuides } = useAlignmentGuides({
        enabled: true,
        snapThreshold: 10
    })

    // Canvas setup with event handlers
    const setupCanvasEvents = useCallback((canvas: fabric.Canvas) => {
        // Setup alignment guides
        const cleanupAlignmentGuides = setupAlignmentGuides(canvas)

        // Map para guardar estados previos de objetos
        const objectPreviousStates = new Map<fabric.FabricObject, any>()

        // Función para limpiar estados pendientes
        const clearPendingStates = () => {
            objectPreviousStates.clear()
            console.log('🧹 Estados pendientes limpiados')
        }

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

        // Double click to load image into placeholder or edit text
        canvas.on('mouse:dblclick', (e) => {
            const target = e.target

            // Image placeholder double-click
            if (target && (target as any).isImagePlaceholder) {
                setSelectedPlaceholder(target)
                setShowUploadDialog(true)
                return
            }

            // Regular textbox double-click - enter editing mode
            if (target && (target.type === 'textbox' || target.type === 'i-text' || target.type === 'text')) {
                const textbox = target as fabric.Textbox
                textbox.set({ editable: true })
                textbox.enterEditing()
                textbox.selectAll()
                canvas.renderAll()
            }
        })

        // Track flexbox background movements to move texts with it
        const flexboxBackgroundPositions = new Map<string, { left: number, top: number }>()

        canvas.on('object:moving', (e) => {
            const target = e.target
            if (!target || !(target as any).isFlexboxBackground) return

            const flexboxId = (target as any).flexboxId
            if (!flexboxId) return

            // Get previous position
            const prevPos = flexboxBackgroundPositions.get(flexboxId) || { left: target.left || 0, top: target.top || 0 }
            const deltaX = (target.left || 0) - prevPos.left
            const deltaY = (target.top || 0) - prevPos.top

            // Move all texts in this flexbox
            const allObjects = canvas.getObjects()
            allObjects.forEach(obj => {
                if ((obj as any).flexboxId === flexboxId && !(obj as any).isFlexboxBackground) {
                    obj.set({
                        left: (obj.left || 0) + deltaX,
                        top: (obj.top || 0) + deltaY,
                    })
                    obj.setCoords()
                }
            })

            // Update stored position
            flexboxBackgroundPositions.set(flexboxId, { left: target.left || 0, top: target.top || 0 })
        })

        // Store initial positions when starting to move
        canvas.on('mouse:down', (e) => {
            const target = e.target
            if (target && (target as any).isFlexboxBackground) {
                const flexboxId = (target as any).flexboxId
                if (flexboxId) {
                    flexboxBackgroundPositions.set(flexboxId, { left: target.left || 0, top: target.top || 0 })
                }
            }
        })

        // When text changes (typing, line breaks), reorganize the flexbox
        canvas.on('text:changed', (e) => {
            const target = e.target
            if (!target || !(target as any).flexboxId || (target as any).isFlexboxBackground) return

            const flexboxId = (target as any).flexboxId

            // Re-layout after a short delay to allow text to finish resizing
            setTimeout(() => {
                layoutFlexbox(canvas, flexboxId)
            }, 10)
        })

        // Auto-save on changes
        let saveTimeout: NodeJS.Timeout | null = null
        let isInitialLoad = true

        const debouncedSave = () => {
            console.log('⏱️ debouncedSave llamado', { isInitialLoad })
            if (isInitialLoad) return
            if (saveTimeout) clearTimeout(saveTimeout)
            saveTimeout = setTimeout(() => {
                console.log('⏰ Timeout completado, llamando a saveCanvasRef.current()')
                saveCanvasRef.current()
            }, 500)
        }

        setTimeout(() => {
            isInitialLoad = false
            console.log('✅ isInitialLoad cambiado a false - auto-save activado')
        }, 1500)

        // Guardar estado ANTES de modificar (para poder hacer undo)
        canvas.on('mouse:down', (e) => {
            const target = e.target
            if (target && !isUndoRedoRef.current && !(target as any).isAlignmentGuide) {
                // Guardar estado previo del objeto que va a ser modificado
                objectPreviousStates.set(target, serializeObject(target))
            }
        })

        // Guardar estado DESPUÉS de modificar (para comparar)
        canvas.on('object:modified', (e) => {
            const target = e.target
            if (!target || isInitialLoad) return

            console.log('🎯 object:modified disparado')

            const previousState = objectPreviousStates.get(target)
            if (previousState) {
                saveObjectModification(canvas, target, previousState)
                objectPreviousStates.delete(target)
            }

            debouncedSave()
        })

        // Objeto añadido
        canvas.on('object:added', (e) => {
            const target = e.target
            if (!target || isInitialLoad || isUndoRedoRef.current) return

            console.log('🎯 object:added disparado para:', target.type)
            saveObjectAddition(canvas, target)
            debouncedSave()
        })

        // Objeto eliminado
        canvas.on('object:removed', (e) => {
            const target = e.target
            if (!target || isUndoRedoRef.current) return

            console.log('🎯 object:removed disparado para:', target.type)
            saveObjectRemoval(canvas, target)
            debouncedSave()
        })

        // Auto-save durante transformaciones (sin guardar en historial aún)
        canvas.on('object:scaling', () => {
            debouncedSave()
        })
        canvas.on('object:rotating', () => {
            debouncedSave()
        })
        canvas.on('object:moving', () => {
            debouncedSave()
        })

        // Texto editado
        canvas.on('text:editing:entered', (e) => {
            const target = e.target
            if (target && !isInitialLoad) {
                // Guardar estado antes de editar texto
                objectPreviousStates.set(target, serializeObject(target))
            }
        })

        canvas.on('text:editing:exited', (e) => {
            const target = e.target
            if (!target || isInitialLoad) return

            const previousState = objectPreviousStates.get(target)
            if (previousState) {
                saveObjectModification(canvas, target, previousState)
                objectPreviousStates.delete(target)
            }

            debouncedSave()
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

        // Exponer clearPendingStates al canvas para acceso desde undo/redo
        ;(canvas as any).__clearPendingStates = clearPendingStates

        // Exponer función para forzar guardado después de undo/redo
        ;(canvas as any).__forceSave = () => {
            console.log('🔥 __forceSave llamado desde undo/redo')
            saveCanvasRef.current()
        }

        // Return cleanup function
        return () => {
            if (cleanupAlignmentGuides) {
                cleanupAlignmentGuides()
            }
        }
    }, [setupAlignmentGuides, serializeObject, saveObjectModification, saveObjectAddition, saveObjectRemoval, isUndoRedoRef])

    const { fabricCanvasRef, baseScaleRef } = useFabricCanvas({
        canvasRef,
        containerRef,
        slideData,
        slideNumber,
        backgroundColor,
        aspectRatio,
        onCanvasEvents: setupCanvasEvents
    })

    // Complete initial load and sync object map
    useEffect(() => {
        setTimeout(() => {
            completeInitialLoad()
            if (fabricCanvasRef.current) {
                // Sincronizar el mapa de objetos con el canvas cargado
                syncObjectMap(fabricCanvasRef.current)
                console.log('✅ Mapa de objetos sincronizado al cargar slide')
            }
        }, 1500)
    }, [completeInitialLoad, syncObjectMap])

    // Save canvas function
    const saveCanvas = useCallback(() => {
        console.log('💾 saveCanvas llamado', {
            isInitialLoad: isInitialLoadRef.current,
            hasCanvas: !!fabricCanvasRef.current
        })

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
            saveBackgroundChange(backgroundColor)
            saveCanvas()
        }
    }, [backgroundColor, saveBackgroundChange])

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

    const handleAddTextFlexbox = () => {
        if (!fabricCanvasRef.current) return
        createTextFlexbox(fabricCanvasRef.current)
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

        // Get the current stroke width to calculate the difference
        const currentStrokeWidth = (selectedObject as any).strokeWidth || 0
        const strokeDiff = width - currentStrokeWidth

        // Store the center point before modifying
        const centerPoint = selectedObject.getCenterPoint()

        // Set strokeUniform to ensure stroke scales properly
        selectedObject.set({
            strokeWidth: width,
            strokeUniform: true,
            paintFirst: 'fill' // Paint fill first, then stroke on top
        })

        // For shapes (not lines, text, or images), adjust dimensions to make border expand outward
        if (selectedObject.type === 'rect' ||
            selectedObject.type === 'circle' ||
            selectedObject.type === 'triangle' ||
            selectedObject.type === 'ellipse' ||
            selectedObject.type === 'polygon') {

            const currentScaleX = selectedObject.scaleX || 1
            const currentScaleY = selectedObject.scaleY || 1

            // Calculate dimension adjustments based on object type
            if (selectedObject.type === 'circle') {
                const circle = selectedObject as fabric.Circle
                const currentRadius = circle.radius || 0
                // Increase radius to compensate for inward stroke
                const newRadius = currentRadius + (strokeDiff / 2)
                circle.set({ radius: Math.max(1, newRadius) })
            } else if (selectedObject.type === 'rect') {
                const rect = selectedObject as fabric.Rect
                const currentWidth = rect.width || 0
                const currentHeight = rect.height || 0
                // Increase dimensions to compensate for inward stroke
                rect.set({
                    width: Math.max(1, currentWidth + strokeDiff),
                    height: Math.max(1, currentHeight + strokeDiff)
                })
            } else if (selectedObject.type === 'triangle') {
                const triangle = selectedObject as fabric.Triangle
                const currentWidth = triangle.width || 0
                const currentHeight = triangle.height || 0
                // Increase dimensions to compensate for inward stroke
                triangle.set({
                    width: Math.max(1, currentWidth + strokeDiff),
                    height: Math.max(1, currentHeight + strokeDiff)
                })
            }

            // Restore center point to keep object in the same position
            selectedObject.setPositionByOrigin(centerPoint, 'center', 'center')
            selectedObject.setCoords()
        }

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

    const handleUpdateFlexboxProperty = (property: string, value: any) => {
        if (!selectedObject || !fabricCanvasRef.current) return
        updateFlexboxProperty(fabricCanvasRef.current, selectedObject, property, value)
        saveCanvas()
    }

    const handleAddTextToFlexbox = () => {
        if (!selectedObject || !fabricCanvasRef.current) return
        addTextToFlexbox(fabricCanvasRef.current, selectedObject)
        saveCanvas()
    }

    const handleRemoveTextFromFlexbox = () => {
        if (!selectedObject || !fabricCanvasRef.current) return
        removeTextFromFlexbox(fabricCanvasRef.current, selectedObject)
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
    const handleZoomIn = useCallback(() => {
        if (!fabricCanvasRef.current) return
        const newZoom = zoomIn(fabricCanvasRef.current, zoom, baseScaleRef.current, aspectRatioDimensions.width, aspectRatioDimensions.height, containerRef)
        setZoom(newZoom)
    }, [fabricCanvasRef, zoom, aspectRatioDimensions.width, aspectRatioDimensions.height])

    const handleZoomOut = useCallback(() => {
        if (!fabricCanvasRef.current) return
        const newZoom = zoomOut(fabricCanvasRef.current, zoom, baseScaleRef.current, aspectRatioDimensions.width, aspectRatioDimensions.height, containerRef)
        setZoom(newZoom)
    }, [fabricCanvasRef, zoom, aspectRatioDimensions.width, aspectRatioDimensions.height])

    const handleFitToScreen = useCallback(() => {
        if (!fabricCanvasRef.current) return
        const newZoom = resetZoom(fabricCanvasRef.current, baseScaleRef.current, aspectRatioDimensions.width, aspectRatioDimensions.height)
        setZoom(newZoom)
    }, [fabricCanvasRef, aspectRatioDimensions.width, aspectRatioDimensions.height])

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

    // Mouse wheel zoom
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            // Only zoom if Ctrl/Cmd key is pressed (standard zoom behavior)
            // This allows normal scrolling without Ctrl/Cmd
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()

                // deltaY < 0 means scrolling up (zoom in)
                // deltaY > 0 means scrolling down (zoom out)
                if (e.deltaY < 0) {
                    handleZoomIn()
                } else if (e.deltaY > 0) {
                    handleZoomOut()
                }
            }
        }

        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [handleZoomIn, handleZoomOut])

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
                onAddTextFlexbox={handleAddTextFlexbox}
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
                    className="flex-1 bg-gray-200 overflow-auto relative p-4"
                    style={{
                        backgroundImage: "url('/img/background.svg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'fixed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="shadow-2xl border-2 border-gray-400 rounded-sm"
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
                onUpdateFlexboxProperty={handleUpdateFlexboxProperty}
                onAddTextToFlexbox={handleAddTextToFlexbox}
                onRemoveTextFromFlexbox={handleRemoveTextFromFlexbox}
            />

            <UploadButtonDialog
                open={showUploadDialog}
                onOpenChange={setShowUploadDialog}
                onUploadComplete={handleAddImage}
            />
        </div>
    )
}
