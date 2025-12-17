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

const NUDGE_DISTANCE = 1 // pixels to move per arrow key press

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

            // Arrow keys - nudge selected objects
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (!fabricCanvasRef.current) return

                const activeObjects = fabricCanvasRef.current.getActiveObjects()

                // Only handle arrow keys if objects are selected
                if (activeObjects && activeObjects.length > 0) {
                    e.preventDefault()

                    let objectsMoved = false

                    activeObjects.forEach((obj) => {
                        const currentLeft = obj.left || 0
                        const currentTop = obj.top || 0

                        switch (e.key) {
                            case 'ArrowUp':
                                if (!obj.lockMovementY) {
                                    obj.set({ top: currentTop - NUDGE_DISTANCE })
                                    objectsMoved = true
                                }
                                break
                            case 'ArrowDown':
                                if (!obj.lockMovementY) {
                                    obj.set({ top: currentTop + NUDGE_DISTANCE })
                                    objectsMoved = true
                                }
                                break
                            case 'ArrowLeft':
                                if (!obj.lockMovementX) {
                                    obj.set({ left: currentLeft - NUDGE_DISTANCE })
                                    objectsMoved = true
                                }
                                break
                            case 'ArrowRight':
                                if (!obj.lockMovementX) {
                                    obj.set({ left: currentLeft + NUDGE_DISTANCE })
                                    objectsMoved = true
                                }
                                break
                        }

                        obj.setCoords()
                    })

                    // If this is an ActiveSelection (multiple objects), update its coordinates
                    const activeSelection = fabricCanvasRef.current.getActiveObject()
                    if (activeSelection && activeSelection.type === 'activeSelection') {
                        (activeSelection as any).setCoords()
                    }

                    fabricCanvasRef.current.renderAll()

                    // Fire object:modified event to trigger auto-save if any objects moved
                    if (objectsMoved) {
                        fabricCanvasRef.current.fire('object:modified', {
                            target: activeObjects[0]
                        })
                    }
                }
                // If no objects selected, let the event propagate for slide navigation
                return
            }

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
