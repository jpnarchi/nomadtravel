/**
 * Hook para gestionar la inicialización y configuración del canvas de Fabric.js
 */

import { useEffect, useRef, useMemo } from 'react'
import * as fabric from 'fabric'
import { loadObjectsToCanvas } from '../fabric-editor/object-loader'
import { AspectRatioType, DEFAULT_ASPECT_RATIO, getAspectRatioDimensions } from '@/lib/aspect-ratios'

interface UseFabricCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    containerRef: React.RefObject<HTMLDivElement | null>
    slideData: any
    slideNumber: number
    backgroundColor: string
    aspectRatio: AspectRatioType
    onCanvasEvents?: (canvas: fabric.Canvas) => void
}

export function useFabricCanvas({
    canvasRef,
    containerRef,
    slideData,
    slideNumber,
    backgroundColor,
    aspectRatio = DEFAULT_ASPECT_RATIO,
    onCanvasEvents
}: UseFabricCanvasProps) {
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const baseScaleRef = useRef(1)

    const aspectRatioDimensions = useMemo(() => getAspectRatioDimensions(aspectRatio), [aspectRatio])

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return

        const container = containerRef.current
        const containerWidth = container.clientWidth - 64
        const containerHeight = container.clientHeight - 64

        const scaleX = containerWidth / aspectRatioDimensions.width
        const scaleY = containerHeight / aspectRatioDimensions.height
        const scale = Math.min(scaleX, scaleY, 1)

        const displayWidth = aspectRatioDimensions.width * scale
        const displayHeight = aspectRatioDimensions.height * scale

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: displayWidth,
            height: displayHeight,
            backgroundColor: backgroundColor,
            selection: true,
            preserveObjectStacking: true,
        })

        canvas.setZoom(scale)
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0]
        baseScaleRef.current = scale

        fabricCanvasRef.current = canvas

        // Load existing slide data
        loadObjectsToCanvas(canvas, slideData, slideNumber)

        // Setup event handlers if provided
        if (onCanvasEvents) {
            onCanvasEvents(canvas)
        }

        // Handle resize
        const handleResize = () => {
            if (!canvasRef.current || !containerRef.current || !fabricCanvasRef.current) return

            const container = containerRef.current
            const containerWidth = container.clientWidth - 64
            const containerHeight = container.clientHeight - 64

            const scaleX = containerWidth / aspectRatioDimensions.width
            const scaleY = containerHeight / aspectRatioDimensions.height
            const newScale = Math.min(scaleX, scaleY, 1)

            const displayWidth = aspectRatioDimensions.width * newScale
            const displayHeight = aspectRatioDimensions.height * newScale

            fabricCanvasRef.current.setWidth(displayWidth)
            fabricCanvasRef.current.setHeight(displayHeight)
            fabricCanvasRef.current.setZoom(newScale)
            fabricCanvasRef.current.viewportTransform = [newScale, 0, 0, newScale, 0, 0]
            baseScaleRef.current = newScale

            fabricCanvasRef.current.renderAll()
        }

        window.addEventListener('resize', handleResize)

        return () => {
            canvas.dispose()
            window.removeEventListener('resize', handleResize)
        }
    }, [aspectRatioDimensions])

    return {
        fabricCanvasRef,
        baseScaleRef
    }
}
