/**
 * Flexbox Reorder Controls - Visual controls for reordering items in a flexbox
 */

import { useEffect, useState } from 'react'
import * as fabric from 'fabric'
import { GripVertical } from 'lucide-react'

interface FlexboxReorderControlsProps {
    canvas: fabric.Canvas | null
    selectedObject: fabric.FabricObject | null
    onReorder: (fromIndex: number, toIndex: number) => void
    onEditText: (textIndex: number) => void
}

interface DragHandle {
    index: number
    x: number
    y: number
    width: number
    height: number
}

export function FlexboxReorderControls({
    canvas,
    selectedObject,
    onReorder,
    onEditText
}: FlexboxReorderControlsProps) {
    const [handles, setHandles] = useState<DragHandle[]>([])
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    useEffect(() => {
        if (!canvas || !selectedObject || !(selectedObject as any).isTextFlexbox) {
            setHandles([])
            return
        }

        const updateHandles = () => {
            const group = selectedObject as fabric.Group
            const objects = group.getObjects()
            const textObjects = objects.slice(1) // Skip background rect

            const canvasZoom = canvas.getZoom()
            const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]

            const newHandles: DragHandle[] = textObjects.map((obj, index) => {
                // Get the group's position and transformations
                const groupLeft = group.left || 0
                const groupTop = group.top || 0
                const groupScaleX = group.scaleX || 1
                const groupScaleY = group.scaleY || 1
                const groupAngle = group.angle || 0

                // Get object's position relative to group
                const objLeft = obj.left || 0
                const objTop = obj.top || 0
                const objWidth = (obj.width || 0) * (obj.scaleX || 1)
                const objHeight = (obj.height || 0) * (obj.scaleY || 1)

                // Calculate position in canvas coordinates
                // Object positions in group are relative to group's center
                const cos = Math.cos(groupAngle * Math.PI / 180)
                const sin = Math.sin(groupAngle * Math.PI / 180)

                const relX = objLeft * groupScaleX
                const relY = objTop * groupScaleY

                const rotatedX = relX * cos - relY * sin
                const rotatedY = relX * sin + relY * cos

                const canvasX = groupLeft + rotatedX
                const canvasY = groupTop + rotatedY

                // Apply viewport transform
                const x = canvasX * canvasZoom + vpt[4]
                const y = canvasY * canvasZoom + vpt[5]
                const width = objWidth * groupScaleX * canvasZoom
                const height = objHeight * groupScaleY * canvasZoom

                return { index, x, y, width, height }
            })

            setHandles(newHandles)
        }

        updateHandles()

        // Update on canvas events
        const handleUpdate = () => updateHandles()
        canvas.on('after:render', handleUpdate)
        canvas.on('object:modified', handleUpdate)
        canvas.on('object:moving', handleUpdate)
        canvas.on('object:scaling', handleUpdate)
        canvas.on('object:rotating', handleUpdate)

        return () => {
            canvas.off('after:render', handleUpdate)
            canvas.off('object:modified', handleUpdate)
            canvas.off('object:moving', handleUpdate)
            canvas.off('object:scaling', handleUpdate)
            canvas.off('object:rotating', handleUpdate)
        }
    }, [canvas, selectedObject])

    if (!canvas || !selectedObject || !(selectedObject as any).isTextFlexbox || handles.length === 0) {
        return null
    }

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(index))
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverIndex(index)
    }

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault()
        const fromIndex = draggedIndex
        if (fromIndex !== null && fromIndex !== toIndex) {
            onReorder(fromIndex, toIndex)
        }
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const handleDoubleClick = (index: number) => {
        onEditText(index)
    }

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
            {handles.map((handle) => (
                <div
                    key={handle.index}
                    className={`absolute pointer-events-auto transition-all duration-150 ${
                        draggedIndex === handle.index ? 'opacity-50' : ''
                    } ${
                        dragOverIndex === handle.index && draggedIndex !== handle.index
                            ? 'border-2 border-blue-500'
                            : ''
                    }`}
                    style={{
                        left: `${handle.x}px`,
                        top: `${handle.y}px`,
                        width: `${handle.width}px`,
                        height: `${handle.height}px`,
                    }}
                    onDragOver={(e) => handleDragOver(e, handle.index)}
                    onDrop={(e) => handleDrop(e, handle.index)}
                    onDoubleClick={() => handleDoubleClick(handle.index)}
                >
                    {/* Drag handle - 6 dots icon */}
                    <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, handle.index)}
                        onDragEnd={handleDragEnd}
                        className="absolute left-1 top-1 bg-blue-500 text-white rounded-md shadow-lg cursor-move hover:bg-blue-600 transition-colors p-1.5 z-10"
                        title="Arrastra para reordenar"
                    >
                        <GripVertical className="size-3" />
                    </div>

                    {/* Edit indicator */}
                    <div className="absolute inset-0 border-2 border-transparent hover:border-blue-400 rounded transition-colors cursor-text" />
                </div>
            ))}
        </div>
    )
}
