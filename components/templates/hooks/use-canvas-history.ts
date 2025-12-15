/**
 * Hook para gestionar historial de undo/redo del canvas
 */

import { useRef, useCallback } from 'react'
import * as fabric from 'fabric'

export function useCanvasHistory(backgroundColor: string) {
    const historyRef = useRef<any[]>([])
    const historyStepRef = useRef<number>(-1)
    const isUndoRedoRef = useRef<boolean>(false)
    const isInitialLoadRef = useRef(true)

    const saveStateToHistory = useCallback((canvas: fabric.Canvas | null) => {
        if (!canvas || isUndoRedoRef.current || isInitialLoadRef.current) {
            return
        }

        const json = (canvas as any).toJSON([
            'selectable', 'evented', 'lockMovementX', 'lockMovementY',
            'lockRotation', 'lockScalingX', 'lockScalingY', 'hasControls',
            'hasBorders', 'opacity', 'src', 'left', 'top', 'scaleX', 'scaleY',
            'angle', 'width', 'height', 'originX', 'originY'
        ])

        const state = { json, backgroundColor }

        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1)
        historyRef.current.push(state)
        historyStepRef.current++

        if (historyRef.current.length > 50) {
            historyRef.current.shift()
            historyStepRef.current--
        }
    }, [backgroundColor])

    const undo = useCallback(async (canvas: fabric.Canvas | null, onBackgroundChange: (color: string) => void) => {
        if (historyStepRef.current <= 0 || !canvas) return

        isUndoRedoRef.current = true
        historyStepRef.current--

        const state = historyRef.current[historyStepRef.current]

        canvas.clear()
        await canvas.loadFromJSON(state.json)

        onBackgroundChange(state.backgroundColor)
        canvas.backgroundColor = state.backgroundColor
        canvas.renderAll()

        setTimeout(() => {
            isUndoRedoRef.current = false
        }, 100)
    }, [])

    const redo = useCallback(async (canvas: fabric.Canvas | null, onBackgroundChange: (color: string) => void) => {
        if (historyStepRef.current >= historyRef.current.length - 1 || !canvas) return

        isUndoRedoRef.current = true
        historyStepRef.current++

        const state = historyRef.current[historyStepRef.current]

        canvas.clear()
        await canvas.loadFromJSON(state.json)

        onBackgroundChange(state.backgroundColor)
        canvas.backgroundColor = state.backgroundColor
        canvas.renderAll()

        setTimeout(() => {
            isUndoRedoRef.current = false
        }, 100)
    }, [])

    const completeInitialLoad = useCallback(() => {
        isInitialLoadRef.current = false
    }, [])

    return {
        saveStateToHistory,
        undo,
        redo,
        completeInitialLoad,
        isInitialLoadRef
    }
}
