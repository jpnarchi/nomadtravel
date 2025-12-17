/**
 * Hook para gestionar historial de undo/redo basado en objetos individuales
 * Este sistema es mucho más eficiente que re-renderizar toda la slide
 */

import { useRef, useCallback } from 'react'
import * as fabric from 'fabric'

// Tipos de acciones
type ActionType = 'add' | 'modify' | 'remove' | 'background'

interface HistoryAction {
    type: ActionType
    objectId: string | null // null para background
    previousState: any | null
    newState: any | null
    timestamp: number
}

// Propiedades a serializar para cada objeto
const SERIALIZABLE_PROPS = [
    'selectable', 'evented', 'lockMovementX', 'lockMovementY',
    'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls',
    'hasBorders', 'opacity', 'src', 'left', 'top', 'scaleX', 'scaleY',
    'angle', 'width', 'height', 'originX', 'originY', 'fill', 'stroke',
    'strokeWidth', 'radius', 'rx', 'ry', 'text', 'fontSize', 'fontFamily',
    'fontWeight', 'fontStyle', 'textAlign', 'lineHeight', 'charSpacing',
    'cropX', 'cropY', 'x1', 'y1', 'x2', 'y2',
    // Custom properties
    'isImagePlaceholder', 'isImageContainer', 'borderRadius',
    'placeholderWidth', 'placeholderHeight', 'isRing', 'ringRadius',
    'ringThickness', 'ringColor', 'outerRadius', 'innerRadius', 'listStyle'
]

export function useObjectHistory(backgroundColor: string) {
    const historyRef = useRef<HistoryAction[]>([])
    const historyStepRef = useRef<number>(-1)
    const isUndoRedoRef = useRef<boolean>(false)
    const isInitialLoadRef = useRef(true)
    const objectMapRef = useRef<Map<string, fabric.FabricObject>>(new Map())
    const currentBackgroundRef = useRef<string>(backgroundColor)

    // Genera un ID único para un objeto
    const getObjectId = useCallback((obj: fabric.FabricObject): string => {
        if (!(obj as any).__historyId) {
            (obj as any).__historyId = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        return (obj as any).__historyId
    }, [])

    // Serializa un objeto a JSON con todas sus propiedades
    const serializeObject = useCallback((obj: fabric.FabricObject): any => {
        const json = (obj as any).toJSON(SERIALIZABLE_PROPS)

        // Añadir tipo para facilitar reconstrucción
        json.objectType = obj.type

        // Guardar ID del objeto
        json.__historyId = getObjectId(obj)

        return json
    }, [getObjectId])

    // Actualiza un objeto existente con nuevos datos sin recrearlo
    const updateObjectInPlace = useCallback((obj: fabric.FabricObject, newData: any) => {
        console.log('🔄 Actualizando objeto en su lugar:', obj.type, newData)

        // Actualizar propiedades básicas
        const updates: any = {}

        // Propiedades de posición y transformación
        if (newData.left !== undefined) updates.left = newData.left
        if (newData.top !== undefined) updates.top = newData.top
        if (newData.scaleX !== undefined) updates.scaleX = newData.scaleX
        if (newData.scaleY !== undefined) updates.scaleY = newData.scaleY
        if (newData.angle !== undefined) updates.angle = newData.angle
        if (newData.originX !== undefined) updates.originX = newData.originX
        if (newData.originY !== undefined) updates.originY = newData.originY

        // Propiedades visuales
        if (newData.opacity !== undefined) updates.opacity = newData.opacity
        if (newData.fill !== undefined) updates.fill = newData.fill
        if (newData.stroke !== undefined) updates.stroke = newData.stroke
        if (newData.strokeWidth !== undefined) updates.strokeWidth = newData.strokeWidth

        // Propiedades de bloqueo
        if (newData.lockMovementX !== undefined) updates.lockMovementX = newData.lockMovementX
        if (newData.lockMovementY !== undefined) updates.lockMovementY = newData.lockMovementY
        if (newData.lockRotation !== undefined) updates.lockRotation = newData.lockRotation
        if (newData.lockScalingX !== undefined) updates.lockScalingX = newData.lockScalingX
        if (newData.lockScalingY !== undefined) updates.lockScalingY = newData.lockScalingY
        if (newData.hasControls !== undefined) updates.hasControls = newData.hasControls

        // Propiedades específicas de texto
        if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
            if (newData.text !== undefined) (obj as any).text = newData.text
            if (newData.fontSize !== undefined) updates.fontSize = newData.fontSize
            if (newData.fontFamily !== undefined) updates.fontFamily = newData.fontFamily
            if (newData.fontWeight !== undefined) updates.fontWeight = newData.fontWeight
            if (newData.fontStyle !== undefined) updates.fontStyle = newData.fontStyle
            if (newData.textAlign !== undefined) updates.textAlign = newData.textAlign
            if (newData.lineHeight !== undefined) updates.lineHeight = newData.lineHeight
            if (newData.charSpacing !== undefined) updates.charSpacing = newData.charSpacing
            if (newData.listStyle !== undefined) (obj as any).listStyle = newData.listStyle
        }

        // Propiedades específicas de círculo/ring
        if (obj.type === 'circle') {
            if (newData.radius !== undefined) updates.radius = newData.radius
            if (newData.isRing !== undefined) {
                (obj as any).isRing = newData.isRing
                if (newData.ringRadius !== undefined) (obj as any).ringRadius = newData.ringRadius
                if (newData.ringThickness !== undefined) (obj as any).ringThickness = newData.ringThickness
                if (newData.ringColor !== undefined) (obj as any).ringColor = newData.ringColor
                if (newData.outerRadius !== undefined) (obj as any).outerRadius = newData.outerRadius
                if (newData.innerRadius !== undefined) (obj as any).innerRadius = newData.innerRadius
            }
        }

        // Propiedades específicas de rectángulo
        if (obj.type === 'rect') {
            if (newData.width !== undefined) updates.width = newData.width
            if (newData.height !== undefined) updates.height = newData.height
            if (newData.rx !== undefined) updates.rx = newData.rx
            if (newData.ry !== undefined) updates.ry = newData.ry
        }

        // Propiedades específicas de línea
        if (obj.type === 'line') {
            if (newData.x1 !== undefined) (obj as any).x1 = newData.x1
            if (newData.y1 !== undefined) (obj as any).y1 = newData.y1
            if (newData.x2 !== undefined) (obj as any).x2 = newData.x2
            if (newData.y2 !== undefined) (obj as any).y2 = newData.y2
        }

        // Propiedades custom de image placeholder/container
        if (newData.isImagePlaceholder !== undefined) {
            (obj as any).isImagePlaceholder = newData.isImagePlaceholder
            if (newData.placeholderWidth !== undefined) (obj as any).placeholderWidth = newData.placeholderWidth
            if (newData.placeholderHeight !== undefined) (obj as any).placeholderHeight = newData.placeholderHeight
        }
        if (newData.isImageContainer !== undefined) {
            (obj as any).isImageContainer = newData.isImageContainer
        }
        if (newData.borderRadius !== undefined) {
            (obj as any).borderRadius = newData.borderRadius
        }

        // Aplicar todas las actualizaciones
        obj.set(updates)
        obj.setCoords()

        return obj
    }, [])

    // Guarda una acción en el historial
    const saveAction = useCallback((action: HistoryAction) => {
        if (isUndoRedoRef.current || isInitialLoadRef.current) {
            return
        }

        console.log('💾 Guardando acción:', action.type, action.objectId)

        // Cortar el historial desde el punto actual
        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1)

        // Añadir nueva acción
        historyRef.current.push(action)
        historyStepRef.current++

        // Sin límite de historial - se mantiene hasta que se guarde la presentación
        console.log(`📊 Historial actual: ${historyRef.current.length} acciones`)
    }, [])

    // Guarda el estado de modificación de un objeto
    const saveObjectModification = useCallback((canvas: fabric.Canvas, obj: fabric.FabricObject, previousState: any) => {
        // Excluir alignment guides del historial
        if ((obj as any).isAlignmentGuide) {
            return
        }

        const objectId = getObjectId(obj)
        const newState = serializeObject(obj)

        objectMapRef.current.set(objectId, obj)

        const action: HistoryAction = {
            type: 'modify',
            objectId,
            previousState,
            newState,
            timestamp: Date.now()
        }

        saveAction(action)
    }, [getObjectId, serializeObject, saveAction])

    // Guarda el estado de adición de un objeto
    const saveObjectAddition = useCallback((canvas: fabric.Canvas, obj: fabric.FabricObject) => {
        // Excluir alignment guides del historial
        if ((obj as any).isAlignmentGuide) {
            return
        }

        const objectId = getObjectId(obj)
        const newState = serializeObject(obj)

        objectMapRef.current.set(objectId, obj)

        const action: HistoryAction = {
            type: 'add',
            objectId,
            previousState: null,
            newState,
            timestamp: Date.now()
        }

        saveAction(action)
    }, [getObjectId, serializeObject, saveAction])

    // Guarda el estado de eliminación de un objeto
    const saveObjectRemoval = useCallback((canvas: fabric.Canvas, obj: fabric.FabricObject) => {
        // Excluir alignment guides del historial
        if ((obj as any).isAlignmentGuide) {
            return
        }

        const objectId = getObjectId(obj)
        const previousState = serializeObject(obj)

        const action: HistoryAction = {
            type: 'remove',
            objectId,
            previousState,
            newState: null,
            timestamp: Date.now()
        }

        saveAction(action)
        objectMapRef.current.delete(objectId)
    }, [getObjectId, serializeObject, saveAction])

    // Guarda cambio de background
    const saveBackgroundChange = useCallback((newBackground: string) => {
        const action: HistoryAction = {
            type: 'background',
            objectId: null,
            previousState: currentBackgroundRef.current,
            newState: newBackground,
            timestamp: Date.now()
        }

        currentBackgroundRef.current = newBackground
        saveAction(action)
    }, [saveAction])

    // Reconstruye un objeto desde JSON (solo cuando es necesario)
    const reconstructObject = useCallback(async (canvas: fabric.Canvas, objData: any): Promise<fabric.FabricObject | null> => {
        const objType = (objData.objectType || objData.type || '').toLowerCase()

        console.log('🏗️ Reconstruyendo objeto:', objType)

        let newObj: fabric.FabricObject | null = null

        try {
            switch (objType) {
                case 'text':
                case 'i-text':
                case 'itext':
                case 'textbox':
                    if (objData.width) {
                        newObj = new fabric.Textbox(objData.text || 'Text', objData)
                    } else {
                        newObj = new fabric.IText(objData.text || 'Text', objData)
                    }
                    if (objData.listStyle) (newObj as any).listStyle = objData.listStyle
                    break
                case 'rect':
                case 'rectangle':
                    newObj = new fabric.Rect(objData)
                    break
                case 'circle':
                    newObj = new fabric.Circle(objData)
                    if (objData.isRing) {
                        (newObj as any).isRing = true
                        ;(newObj as any).ringRadius = objData.ringRadius
                        ;(newObj as any).ringThickness = objData.ringThickness
                        ;(newObj as any).ringColor = objData.ringColor
                        ;(newObj as any).outerRadius = objData.outerRadius
                        ;(newObj as any).innerRadius = objData.innerRadius
                    }
                    break
                case 'triangle':
                    newObj = new fabric.Triangle(objData)
                    break
                case 'line':
                    newObj = await fabric.Line.fromObject(objData)
                    break
                case 'image':
                    if (objData.src) {
                        newObj = await fabric.FabricImage.fromURL(objData.src)
                        newObj.set(objData)
                        if (objData.isImageContainer) {
                            (newObj as any).isImageContainer = true
                            ;(newObj as any).borderRadius = objData.borderRadius || 0
                        }
                    }
                    break
                case 'group':
                    newObj = await fabric.Group.fromObject(objData)
                    if (objData.isImagePlaceholder) {
                        (newObj as any).isImagePlaceholder = true
                        ;(newObj as any).placeholderWidth = objData.placeholderWidth
                        ;(newObj as any).placeholderHeight = objData.placeholderHeight
                        ;(newObj as any).borderRadius = objData.borderRadius || 0
                    }
                    break
                default:
                    console.warn('⚠️ Tipo de objeto desconocido:', objType)
                    return null
            }

            if (newObj && objData.__historyId) {
                (newObj as any).__historyId = objData.__historyId
                objectMapRef.current.set(objData.__historyId, newObj)
            }

            return newObj
        } catch (error) {
            console.error('❌ Error reconstruyendo objeto:', error)
            return null
        }
    }, [])

    // Undo: Revierte la última acción
    const undo = useCallback(async (canvas: fabric.Canvas | null, onBackgroundChange: (color: string) => void) => {
        if (historyStepRef.current < 0 || !canvas) {
            console.log('⚠️ No hay nada que deshacer')
            return
        }

        isUndoRedoRef.current = true

        const action = historyRef.current[historyStepRef.current]
        console.log('↩️ UNDO acción:', action.type, action.objectId)

        try {
            if (action.type === 'background') {
                // Cambiar background
                if (action.previousState) {
                    currentBackgroundRef.current = action.previousState
                    onBackgroundChange(action.previousState)
                    canvas.backgroundColor = action.previousState
                    canvas.renderAll()
                }
            } else if (action.type === 'add') {
                // Eliminar objeto que fue añadido
                const obj = objectMapRef.current.get(action.objectId!)
                if (obj) {
                    canvas.remove(obj)
                    objectMapRef.current.delete(action.objectId!)
                    canvas.renderAll()
                }
            } else if (action.type === 'remove') {
                // Re-añadir objeto que fue eliminado
                if (action.previousState) {
                    const newObj = await reconstructObject(canvas, action.previousState)
                    if (newObj) {
                        canvas.add(newObj)
                        canvas.renderAll()
                    }
                }
            } else if (action.type === 'modify') {
                // Revertir modificación
                const obj = objectMapRef.current.get(action.objectId!)
                if (obj && action.previousState) {
                    updateObjectInPlace(obj, action.previousState)
                    canvas.renderAll()
                }
            }

            historyStepRef.current--

            // Limpiar estados pendientes para evitar que se guarden incorrectamente
            if ((canvas as any).__clearPendingStates) {
                (canvas as any).__clearPendingStates()
            }

            // Descartar selección activa para evitar eventos adicionales
            canvas.discardActiveObject()
            canvas.renderAll()

            // CRÍTICO: Forzar guardado automático después del undo
            // Esto asegura que el estado post-undo se guarde correctamente
            setTimeout(() => {
                if ((canvas as any).__forceSave) {
                    console.log('💾 Forzando guardado después de undo')
                    ;(canvas as any).__forceSave()
                }
            }, 150)
        } catch (error) {
            console.error('❌ Error en undo:', error)
        } finally {
            setTimeout(() => {
                isUndoRedoRef.current = false
            }, 500) // Extendido a 500ms para evitar que se capturen eventos prematuros
        }
    }, [reconstructObject, updateObjectInPlace])

    // Redo: Reaplica la acción
    const redo = useCallback(async (canvas: fabric.Canvas | null, onBackgroundChange: (color: string) => void) => {
        if (historyStepRef.current >= historyRef.current.length - 1 || !canvas) {
            console.log('⚠️ No hay nada que rehacer')
            return
        }

        isUndoRedoRef.current = true
        historyStepRef.current++

        const action = historyRef.current[historyStepRef.current]
        console.log('↪️ REDO acción:', action.type, action.objectId)

        try {
            if (action.type === 'background') {
                // Cambiar background
                if (action.newState) {
                    currentBackgroundRef.current = action.newState
                    onBackgroundChange(action.newState)
                    canvas.backgroundColor = action.newState
                    canvas.renderAll()
                }
            } else if (action.type === 'add') {
                // Re-añadir objeto
                if (action.newState) {
                    const newObj = await reconstructObject(canvas, action.newState)
                    if (newObj) {
                        canvas.add(newObj)
                        canvas.renderAll()
                    }
                }
            } else if (action.type === 'remove') {
                // Re-eliminar objeto
                const obj = objectMapRef.current.get(action.objectId!)
                if (obj) {
                    canvas.remove(obj)
                    objectMapRef.current.delete(action.objectId!)
                    canvas.renderAll()
                }
            } else if (action.type === 'modify') {
                // Re-aplicar modificación
                const obj = objectMapRef.current.get(action.objectId!)
                if (obj && action.newState) {
                    updateObjectInPlace(obj, action.newState)
                    canvas.renderAll()
                }
            }

            // Limpiar estados pendientes para evitar que se guarden incorrectamente
            if ((canvas as any).__clearPendingStates) {
                (canvas as any).__clearPendingStates()
            }

            // Descartar selección activa para evitar eventos adicionales
            canvas.discardActiveObject()
            canvas.renderAll()

            // CRÍTICO: Forzar guardado automático después del redo
            setTimeout(() => {
                if ((canvas as any).__forceSave) {
                    console.log('💾 Forzando guardado después de redo')
                    ;(canvas as any).__forceSave()
                }
            }, 150)
        } catch (error) {
            console.error('❌ Error en redo:', error)
        } finally {
            setTimeout(() => {
                isUndoRedoRef.current = false
            }, 500) // Extendido a 500ms para evitar que se capturen eventos prematuros
        }
    }, [reconstructObject, updateObjectInPlace])

    const completeInitialLoad = useCallback(() => {
        isInitialLoadRef.current = false
        console.log('✅ Initial load completado - historial activado')
    }, [])

    // Sincroniza el mapa de objetos con el canvas actual
    const syncObjectMap = useCallback((canvas: fabric.Canvas) => {
        objectMapRef.current.clear()
        canvas.getObjects().forEach(obj => {
            // Excluir alignment guides del mapa
            if ((obj as any).isAlignmentGuide) {
                return
            }
            const id = getObjectId(obj)
            objectMapRef.current.set(id, obj)
        })
        console.log('🔄 Mapa de objetos sincronizado:', objectMapRef.current.size, 'objetos')
    }, [getObjectId])

    // Limpia el historial (llamar cuando se guarda la presentación)
    const clearHistory = useCallback(() => {
        const currentLength = historyRef.current.length
        historyRef.current = []
        historyStepRef.current = -1
        console.log(`🗑️ Historial limpiado - se eliminaron ${currentLength} acciones`)
    }, [])

    // Obtiene información del estado actual del historial
    const getHistoryInfo = useCallback(() => {
        return {
            totalActions: historyRef.current.length,
            currentStep: historyStepRef.current,
            canUndo: historyStepRef.current >= 0,
            canRedo: historyStepRef.current < historyRef.current.length - 1,
            undoStepsAvailable: historyStepRef.current + 1,
            redoStepsAvailable: historyRef.current.length - historyStepRef.current - 1
        }
    }, [])

    return {
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
    }
}
