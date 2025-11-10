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
import {UploadButtonDialog} from "./fabric-editor/image-upload-button"

interface FabricSlideEditorProps {
    slideData: any
    onSlideChange: (slideData: any) => void
    slideNumber: number
    totalSlides: number
    onCopyObject: (objectData: any) => void
    onPasteObject: () => any
    isSidebarCollapsed?: boolean
    onToggleSidebar?: () => void
}

export function FabricSlideEditor({
    slideData,
    onSlideChange,
    slideNumber,
    totalSlides,
    onCopyObject,
    onPasteObject,
    isSidebarCollapsed,
    onToggleSidebar
}: FabricSlideEditorProps) {
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const saveCanvasRef = useRef<() => void>(() => {})
    const isInitialLoadRef = useRef(true)
    const baseScaleRef = useRef(1)


    // Convex mutations
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const saveImage = useMutation(api.files.saveImage)

    // State
    const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null)
    const [backgroundColor, setBackgroundColor] = useState(slideData?.background || '#ffffff')
    const [zoom, setZoom] = useState(1)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // History management for undo/redo
    const historyRef = useRef<any[]>([])
    const historyStepRef = useRef<number>(-1)
    const isUndoRedoRef = useRef<boolean>(false)

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

        // Log current canvas objects before serialization
        console.log('📊 Objetos en canvas ANTES de serializar:')
        const objects = fabricCanvasRef.current.getObjects()
        objects.forEach((obj, index) => {
            console.log(`  ${index}. ${obj.type} at (${obj.left}, ${obj.top}) scale(${obj.scaleX}, ${obj.scaleY})`)

            // Warn about suspicious coordinates (likely ActiveSelection bug)
            if (obj.left < -100 || obj.top < -100) {
                console.warn(`⚠️ ADVERTENCIA: Objeto ${index} tiene coordenadas sospechosas: (${obj.left}, ${obj.top})`)
                console.warn('   Esto puede indicar que el objeto está en un grupo ActiveSelection')
            }
        })

        const slideJSON = serializeCanvas(fabricCanvasRef.current, backgroundColor)



        // Log what's being saved
        console.log('📦 Datos que se guardarán:')
        slideJSON.objects.forEach((obj, index) => {
            console.log(`  ${index}. ${obj.type} at (${obj.left}, ${obj.top}) scale(${obj.scaleX}, ${obj.scaleY})`)
        })

        console.log('🔄 Llamando onSlideChange con:', JSON.stringify(slideJSON, null, 2))
        onSlideChange(slideJSON)
        console.log('✅ onSlideChange llamado exitosamente')
    }

    // Update ref
    useEffect(() => {
        saveCanvasRef.current = saveCanvas
    })

    // ============================================================================
    // HISTORY (UNDO/REDO) FUNCTIONS
    // ============================================================================
    const saveStateToHistory = () => {
        if (!fabricCanvasRef.current || isUndoRedoRef.current || isInitialLoadRef.current) {
            return
        }

        const json = (fabricCanvasRef.current as any).toJSON(['selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls', 'hasBorders', 'opacity', 'src', 'left', 'top', 'scaleX', 'scaleY', 'angle', 'width', 'height', 'originX', 'originY'])
        const state = {
            json,
            backgroundColor
        }

        // Remove any states after current step (if we're not at the end)
        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1)

        // Add new state
        historyRef.current.push(state)
        historyStepRef.current++

        // Limit history to 50 steps
        if (historyRef.current.length > 50) {
            historyRef.current.shift()
            historyStepRef.current--
        }

        console.log('💾 Estado guardado en historial. Step:', historyStepRef.current, 'Total:', historyRef.current.length)
    }

    const undo = async () => {
        if (historyStepRef.current <= 0 || !fabricCanvasRef.current) {
            console.log('⏮️ No hay más estados para deshacer')
            return
        }

        isUndoRedoRef.current = true
        historyStepRef.current--

        const state = historyRef.current[historyStepRef.current]

        fabricCanvasRef.current.clear()
        await fabricCanvasRef.current.loadFromJSON(state.json)

        setBackgroundColor(state.backgroundColor)
        fabricCanvasRef.current.backgroundColor = state.backgroundColor
        fabricCanvasRef.current.renderAll()

        saveCanvas()

        setTimeout(() => {
            isUndoRedoRef.current = false
        }, 100)

        console.log('⏮️ Undo. Step:', historyStepRef.current)
        toast.success('Undo')
    }

    const redo = async () => {
        if (historyStepRef.current >= historyRef.current.length - 1 || !fabricCanvasRef.current) {
            console.log('⏭️ No hay más estados para rehacer')
            return
        }

        isUndoRedoRef.current = true
        historyStepRef.current++

        const state = historyRef.current[historyStepRef.current]

        fabricCanvasRef.current.clear()
        await fabricCanvasRef.current.loadFromJSON(state.json)

        setBackgroundColor(state.backgroundColor)
        fabricCanvasRef.current.backgroundColor = state.backgroundColor
        fabricCanvasRef.current.renderAll()

        saveCanvas()

        setTimeout(() => {
            isUndoRedoRef.current = false
        }, 100)

        console.log('⏭️ Redo. Step:', historyStepRef.current)
        toast.success('Redo')
    }

    // ============================================================================
    // INITIALIZE CANVAS
    // ============================================================================
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return

        const container = containerRef.current
        // Account for padding (16px on each side = 32px total)
        const containerWidth = container.clientWidth - 64
        const containerHeight = container.clientHeight - 64

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

            // Save initial state to history
            saveStateToHistory()
        }, 1500)

        // Handle resize
        const handleResize = () => {
            if (!canvasRef.current || !containerRef.current || !fabricCanvasRef.current) return

            const container = containerRef.current
            // Account for padding (16px on each side = 32px total)
            const containerWidth = container.clientWidth - 64
            const containerHeight = container.clientHeight - 64

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


                // CRITICAL: Clear any active selection before cleanup save
                // This prevents saving objects with group-relative coordinates
                const activeObject = fabricCanvasRef.current.getActiveObject()
                if (activeObject && activeObject.type === 'activeSelection') {
                    console.log('⚠️ ActiveSelection detectada durante cleanup - limpiando selección')
                    fabricCanvasRef.current.discardActiveObject()
                    fabricCanvasRef.current.renderAll()
                }

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

        // Save state to history on meaningful changes
        canvas.on('object:modified', () => {
            saveStateToHistory()
            debouncedSave()
        })
        canvas.on('object:added', (e) => {
            if (!isInitialLoad) {
                saveStateToHistory()
                debouncedSave()
            }
        })
        canvas.on('object:removed', () => {
            saveStateToHistory()
            debouncedSave()
        })
        canvas.on('object:scaling', () => debouncedSave())
        canvas.on('object:rotating', () => debouncedSave())
        canvas.on('object:moving', () => debouncedSave())
        canvas.on('text:changed', (e) => {
            if (!isInitialLoad) debouncedSave()
        })
        canvas.on('text:editing:exited', (e) => {
            if (!isInitialLoad) {
                saveStateToHistory()
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
    }

    // ============================================================================
    // BACKGROUND COLOR EFFECT
    // ============================================================================
    useEffect(() => {
        if (fabricCanvasRef.current && !isInitialLoadRef.current) {
            fabricCanvasRef.current.backgroundColor = backgroundColor
            fabricCanvasRef.current.renderAll()
            saveStateToHistory()
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
        if (!fabricCanvasRef.current) return

        const activeObjects = fabricCanvasRef.current.getActiveObjects()

        if (activeObjects.length === 0) return

        // Remove all selected objects
        activeObjects.forEach(obj => {
            fabricCanvasRef.current?.remove(obj)
        })

        fabricCanvasRef.current.discardActiveObject()
        fabricCanvasRef.current.renderAll()
        setSelectedObject(null)
        saveCanvas()

        toast.success(`${activeObjects.length} object${activeObjects.length > 1 ? 's' : ''} deleted`)
    }

    const handleCopyObject = () => {
        if (!fabricCanvasRef.current) return

        const activeSelection = fabricCanvasRef.current.getActiveObject()

        if (!activeSelection) {
            toast.error('No objects selected to copy')
            return
        }

        const activeObjects = fabricCanvasRef.current.getActiveObjects()

        if (activeObjects.length === 0) {
            toast.error('No objects selected to copy')
            return
        }

        // Copy all selected objects
        const objectsData = activeObjects.map(obj => {
            const data = copyObjectToJSON(obj)

            // CRITICAL FIX: Get TRUE canvas position using calcTransformMatrix + qrDecompose
            // This correctly extracts absolute canvas coordinates even when object is in an ActiveSelection group
            const matrix = obj.calcTransformMatrix()
            const decomposed = fabric.util.qrDecompose(matrix)

            console.log(`📋 Copying ${obj.type}:`, {
                groupRelative: { left: obj.left, top: obj.top },
                trueCanvasPosition: { left: decomposed.translateX, top: decomposed.translateY }
            })

            // Override with TRUE canvas coordinates
            data.left = decomposed.translateX
            data.top = decomposed.translateY

            return data
        })

        // Store as array if multiple, single object if one
        const dataToStore = objectsData.length === 1 ? objectsData[0] : objectsData

        onCopyObject(dataToStore) // Parent will show success toast

        console.log(`📋 ${objectsData.length} objeto(s) copiado(s) con posiciones absolutas`)
    }

    const handlePasteObject = async () => {
        if (!fabricCanvasRef.current) return

        const copiedData = onPasteObject()
        if (!copiedData) {
            toast.error('No object to paste')
            return
        }

        try {
            // Check if it's an array (multiple objects) or single object
            const objectsToPaste = Array.isArray(copiedData) ? copiedData : [copiedData]

            console.log(`📋 Pegando ${objectsToPaste.length} objeto(s)`)

            // Calculate bounding box of all objects
            let minLeft = Infinity
            let minTop = Infinity
            let maxRight = -Infinity
            let maxBottom = -Infinity

            objectsToPaste.forEach(obj => {
                const left = obj.left || 0
                const top = obj.top || 0
                const width = (obj.width || 100) * (obj.scaleX || 1)
                const height = (obj.height || 100) * (obj.scaleY || 1)

                minLeft = Math.min(minLeft, left)
                minTop = Math.min(minTop, top)
                maxRight = Math.max(maxRight, left + width)
                maxBottom = Math.max(maxBottom, top + height)
            })

            const groupWidth = maxRight - minLeft
            const groupHeight = maxBottom - minTop

            console.log('📏 Bounding box original:', {
                minLeft, minTop, maxRight, maxBottom, groupWidth, groupHeight,
                objects: objectsToPaste.map(o => ({ left: o.left, top: o.top, width: o.width, height: o.height }))
            })

            // If objects are off-screen (negative or too large), paste at canvas center
            // Otherwise paste with 50px offset
            let targetLeft, targetTop

            if (minLeft < 0 || minTop < 0 || minLeft > 1920 || minTop > 1080) {
                // Objects are off-screen, paste at center
                targetLeft = (1920 - groupWidth) / 2
                targetTop = (1080 - groupHeight) / 2
                console.log('📍 Objetos fuera de pantalla, pegando en centro:', { targetLeft, targetTop })
            } else {
                // Objects are on-screen, paste with offset
                targetLeft = minLeft + 50
                targetTop = minTop + 50
                console.log('📍 Pegando con offset de 50px:', { targetLeft, targetTop })
            }

            // Calculate the offset to apply to all objects
            const offsetX = targetLeft - minLeft
            const offsetY = targetTop - minTop

            console.log('📐 Offset calculation:', {
                targetLeft, targetTop,
                minLeft, minTop,
                offsetX, offsetY
            })

            // Paste all objects with relative positioning maintained
            const pastedObjects: fabric.FabricObject[] = []
            for (const objData of objectsToPaste) {
                // Create a copy of objData with offset applied
                const offsetObjData = {
                    ...objData,
                    left: objData.left + offsetX,
                    top: objData.top + offsetY
                }

                console.log('📋 Pegando objeto:', {
                    type: offsetObjData.type,
                    originalLeft: objData.left,
                    originalTop: objData.top,
                    newLeft: offsetObjData.left,
                    newTop: offsetObjData.top
                })

                const pastedObj = await pasteObjectFromJSON(fabricCanvasRef.current, offsetObjData)
                if (pastedObj) {
                    pastedObjects.push(pastedObj)
                }
            }

            // Log positions before selection
            console.log('📍 Posiciones ANTES de selección:')
            pastedObjects.forEach((obj, i) => {
                console.log(`  ${i}. ${obj.type} at (${obj.left}, ${obj.top})`)
            })

            // Select all pasted objects if multiple
            // CRITICAL: Use setActiveObject with an ActiveSelection WITHOUT transforming coordinates
            // We need to let Fabric handle the selection naturally
            if (pastedObjects.length > 0 && fabricCanvasRef.current) {
                if (pastedObjects.length === 1) {
                    // Single object - just select it
                    fabricCanvasRef.current.setActiveObject(pastedObjects[0])
                } else {
                    // Multiple objects - let user see them but don't force a selection
                    // Creating an ActiveSelection here would transform coordinates
                    fabricCanvasRef.current.discardActiveObject()
                }
                fabricCanvasRef.current.renderAll()
            }

            // Log positions after selection
            console.log('📍 Posiciones DESPUÉS de selección:')
            pastedObjects.forEach((obj, i) => {
                console.log(`  ${i}. ${obj.type} at (${obj.left}, ${obj.top})`)
            })

            // Save AFTER selection is complete
            setTimeout(() => {
                console.log('📍 Posiciones ANTES de saveCanvas:')
                pastedObjects.forEach((obj, i) => {
                    console.log(`  ${i}. ${obj.type} at (${obj.left}, ${obj.top})`)
                })

                // CRITICAL: Force save even if initial load hasn't completed
                // This ensures cross-slide paste operations are saved
                const wasInitialLoad = isInitialLoadRef.current
                isInitialLoadRef.current = false
                saveCanvas()
                console.log(`🔧 Force-disabled isInitialLoad for paste save (was: ${wasInitialLoad})`)
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
        const newZoom = zoomIn(fabricCanvasRef.current, zoom, baseScaleRef.current)
        setZoom(newZoom)
    }

    const handleZoomOut = () => {
        if (!fabricCanvasRef.current) return
        const newZoom = zoomOut(fabricCanvasRef.current, zoom, baseScaleRef.current)
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

            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
                e.preventDefault()
                redo()
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                undo()
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && !isTextInput) {
                e.preventDefault()
                handleDeleteSelected()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedObject, handleCopyObject, handlePasteObject, handleDeleteSelected, undo, redo])

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
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={onToggleSidebar}
            />

            {/* Center - Canvas Area */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Top Toolbar */}
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
                />

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-zinc-800 flex items-start justify-center overflow-auto relative p-4"
                >
                    <canvas
                        ref={canvasRef}
                        className="shadow-2xl border-2 border-zinc-600 rounded-sm flex-shrink-0"
                        style={{
                            display: 'block',
                        }}
                    />

                    <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1.5 rounded backdrop-blur-sm">
                        <p className="text-[10px] text-zinc-300">Shift+Drag to move</p>
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
