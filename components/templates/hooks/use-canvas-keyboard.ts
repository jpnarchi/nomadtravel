/**
 * Hook para gestionar los atajos de teclado del canvas
 */

import { useEffect } from 'react'
import * as fabric from 'fabric'

interface UseCanvasKeyboardProps {
    fabricCanvasRef: React.RefObject<fabric.Canvas | null>
    onCopy: () => void
    onPaste: () => void
    onDelete: () => void
    onUndo: () => void
    onRedo: () => void
}

export function useCanvasKeyboard({
    fabricCanvasRef,
    onCopy,
    onPaste,
    onDelete,
    onUndo,
    onRedo
}: UseCanvasKeyboardProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement
            const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

            // Check if editing text in canvas
            if (fabricCanvasRef.current) {
                const activeObject = fabricCanvasRef.current.getActiveObject()
                if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox') && (activeObject as any).isEditing) {
                    return
                }
            }

            if (isTextInput) return

            // Copy
            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                e.preventDefault()
                onCopy()
            }

            // Paste
            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                e.preventDefault()
                onPaste()
            }

            // Redo
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
                e.preventDefault()
                onRedo()
            }
            // Undo
            else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                onUndo()
            }

            // Delete
            if ((e.key === 'Delete' || e.key === 'Backspace') && !isTextInput) {
                e.preventDefault()
                onDelete()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [fabricCanvasRef, onCopy, onPaste, onDelete, onUndo, onRedo])
}
