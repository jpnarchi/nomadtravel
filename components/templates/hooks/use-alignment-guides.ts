/**
 * Hook para gestionar guías de alineación y snapping
 */

import { useCallback, useRef } from 'react'
import * as fabric from 'fabric'
import {
    getCanvasAlignmentGuides,
    getObjectAlignmentGuides,
    detectActiveGuides,
    calculateSnap,
    drawAlignmentGuides,
    clearAlignmentGuides,
    type AlignmentGuide
} from '../fabric-editor/alignment-guides'

interface UseAlignmentGuidesProps {
    enabled?: boolean
    snapThreshold?: number
}

export function useAlignmentGuides({
    enabled = true,
    snapThreshold = 10
}: UseAlignmentGuidesProps = {}) {
    const activeGuidesRef = useRef<AlignmentGuide[]>([])
    const isMovingRef = useRef(false)

    /**
     * Configura los event handlers para el canvas
     */
    const setupAlignmentGuides = useCallback((canvas: fabric.Canvas) => {
        if (!enabled) return

        const canvasWidth = canvas.width! / (canvas.getZoom() || 1)
        const canvasHeight = canvas.height! / (canvas.getZoom() || 1)

        // Guías del canvas (centro, tercios, bordes)
        const canvasGuides = getCanvasAlignmentGuides(canvasWidth, canvasHeight)

        // Handler para cuando un objeto empieza a moverse
        const handleMoving = (e: any) => {
            const target = e.target as fabric.FabricObject | undefined
            if (!target || e.transform?.action !== 'drag') return

            isMovingRef.current = true

            // Obtiene todos los objetos excepto el activo y las guías
            const allObjects = canvas.getObjects().filter(obj =>
                obj !== target && !(obj as any).isAlignmentGuide
            )

            // Obtiene guías basadas en otros objetos
            const objectGuides = getObjectAlignmentGuides(target, allObjects)

            // Detecta guías activas
            const activeGuides = detectActiveGuides(
                target,
                canvasGuides,
                objectGuides,
                snapThreshold / (canvas.getZoom() || 1)
            )

            activeGuidesRef.current = activeGuides

            // Dibuja las guías (pero no hace nada más - el movimiento es libre)
            if (activeGuides.length > 0) {
                drawAlignmentGuides(canvas, activeGuides, canvas.getZoom() || 1)
            } else {
                clearAlignmentGuides(canvas)
            }

            // NO aplicamos snapping automático aquí para permitir movimiento libre
            // El snapping se aplicará solo cuando el usuario suelte el objeto
        }

        // Handler para cuando el objeto deja de moverse
        const handleModified = (e: any) => {
            if (!isMovingRef.current) return

            const target = e.target as fabric.FabricObject | undefined
            if (!target) {
                isMovingRef.current = false
                clearAlignmentGuides(canvas)
                activeGuidesRef.current = []
                return
            }

            // Aplica snapping solo cuando el usuario suelta el objeto
            if (activeGuidesRef.current.length > 0) {
                const snap = calculateSnap(target, activeGuidesRef.current)

                if (snap.left !== undefined || snap.top !== undefined) {
                    target.set({
                        left: snap.left !== undefined ? snap.left : target.left,
                        top: snap.top !== undefined ? snap.top : target.top
                    })
                    target.setCoords()
                    canvas.requestRenderAll()
                }
            }

            isMovingRef.current = false
            clearAlignmentGuides(canvas)
            activeGuidesRef.current = []
        }

        // Handler para mouse:up (limpia guías incluso si no hay modificación)
        const handleMouseUp = () => {
            if (isMovingRef.current) {
                isMovingRef.current = false
                clearAlignmentGuides(canvas)
                activeGuidesRef.current = []
            }
        }

        // Agregar event listeners
        canvas.on('object:moving', handleMoving)
        canvas.on('object:modified', handleModified)
        canvas.on('mouse:up', handleMouseUp)

        // Cleanup function
        return () => {
            canvas.off('object:moving', handleMoving)
            canvas.off('object:modified', handleModified)
            canvas.off('mouse:up', handleMouseUp)
            clearAlignmentGuides(canvas)
        }
    }, [enabled, snapThreshold])

    /**
     * Limpia manualmente las guías del canvas
     */
    const clearGuides = useCallback((canvas: fabric.Canvas) => {
        clearAlignmentGuides(canvas)
        activeGuidesRef.current = []
    }, [])

    /**
     * Obtiene las guías activas actuales
     */
    const getActiveGuides = useCallback(() => {
        return activeGuidesRef.current
    }, [])

    return {
        setupAlignmentGuides,
        clearGuides,
        getActiveGuides
    }
}
