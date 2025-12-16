/**
 * Sidebar lateral con miniaturas de slides
 */

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Plus,
    Trash2,
    Copy,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import * as fabric from 'fabric'

interface Slide {
    id: string
    path: string
    data: any
}

interface SlidesSidebarProps {
    slides: Slide[]
    currentSlideIndex: number
    onSlideClick: (index: number) => void
    onAddSlide: () => void
    onDuplicateSlide: (index: number) => void
    onDeleteSlide: (index: number) => void
    onMoveSlideUp: (index: number) => void
    onMoveSlideDown: (index: number) => void
}

// Componente para renderizar una miniatura de la slide
function SlidePreview({ slideData }: { slideData: any }) {
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const [isRendered, setIsRendered] = useState(false)

    // Dimensiones para la miniatura - ajustadas al ancho disponible en el sidebar
    // Sidebar: w-64 (256px) - p-4 (32px) - p-3 (24px) = ~200px disponibles
    const thumbnailWidth = 200
    const thumbnailHeight = Math.round(thumbnailWidth * 9 / 16) // 112.5 -> 113px para mantener aspect ratio 16:9

    // Dimensiones originales del canvas (asumiendo 1920x1080 para 16:9)
    const originalWidth = 1920
    const originalHeight = 1080

    // Initialize canvas
    useEffect(() => {
        if (!canvasElement || !slideData || fabricCanvasRef.current) return

        const canvas = new fabric.Canvas(canvasElement, {
            width: thumbnailWidth,
            height: thumbnailHeight,
            backgroundColor: slideData.background || '#ffffff',
            selection: false,
        })

        // Scale from original dimensions to thumbnail
        const scale = thumbnailWidth / originalWidth
        canvas.setZoom(scale)
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0]

        fabricCanvasRef.current = canvas
        setIsRendered(true)

        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose()
                fabricCanvasRef.current = null
            }
        }
    }, [canvasElement, slideData])

    // Render slide objects
    useEffect(() => {
        if (!fabricCanvasRef.current || !slideData || !isRendered) return

        const canvas = fabricCanvasRef.current
        canvas.clear()
        canvas.backgroundColor = slideData.background || '#ffffff'

        const loadSlideObjects = async () => {
            if (!slideData.objects || !Array.isArray(slideData.objects)) {
                canvas.renderAll()
                return
            }

            const sortedObjects = [...slideData.objects].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            const objectPromises = sortedObjects.map(async (obj: any) => {
                try {
                    const objType = (obj.type || '').toLowerCase()
                    let fabricObj: fabric.FabricObject | null = null

                    switch (objType) {
                        case 'text':
                        case 'i-text':
                        case 'itext':
                        case 'textbox':
                            if (obj.width) {
                                fabricObj = new fabric.Textbox(obj.text || 'Text', {
                                    left: obj.left,
                                    top: obj.top,
                                    width: obj.width,
                                    fontSize: obj.fontSize || 40,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    fontStyle: obj.fontStyle || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                    lineHeight: obj.lineHeight,
                                    charSpacing: obj.charSpacing,
                                    originX: obj.originX,
                                    originY: obj.originY,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                })
                            } else {
                                fabricObj = new fabric.IText(obj.text || 'Text', {
                                    left: obj.left,
                                    top: obj.top,
                                    fontSize: obj.fontSize || 40,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    fontStyle: obj.fontStyle || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                    lineHeight: obj.lineHeight,
                                    charSpacing: obj.charSpacing,
                                    originX: obj.originX,
                                    originY: obj.originY,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                })
                            }
                            break
                        case 'rect':
                        case 'rectangle':
                            fabricObj = new fabric.Rect({
                                left: obj.left,
                                top: obj.top,
                                width: obj.width || 100,
                                height: obj.height || 100,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                rx: obj.rx || 0,
                                ry: obj.ry || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break
                        case 'circle':
                            fabricObj = new fabric.Circle({
                                left: obj.left,
                                top: obj.top,
                                radius: obj.radius || 50,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break
                        case 'triangle':
                            fabricObj = new fabric.Triangle({
                                left: obj.left,
                                top: obj.top,
                                width: obj.width || 100,
                                height: obj.height || 100,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break
                        case 'line':
                            fabricObj = await fabric.Line.fromObject(obj)
                            break
                        case 'group':
                            try {
                                fabricObj = await fabric.Group.fromObject(obj)
                            } catch (err) {
                                console.error('Error loading group:', err)
                                return null
                            }
                            break
                        case 'image':
                            if (obj.src) {
                                try {
                                    const img = await fabric.FabricImage.fromURL(obj.src, { crossOrigin: 'anonymous' })
                                    if (obj.left !== undefined) img.set('left', obj.left)
                                    if (obj.top !== undefined) img.set('top', obj.top)
                                    if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
                                    if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
                                    if (obj.angle !== undefined) img.set('angle', obj.angle)
                                    if (obj.originX !== undefined) img.set('originX', obj.originX)
                                    if (obj.originY !== undefined) img.set('originY', obj.originY)

                                    // Restore crop properties for image containers
                                    if (obj.cropX !== undefined) (img as any).cropX = obj.cropX
                                    if (obj.cropY !== undefined) (img as any).cropY = obj.cropY
                                    if (obj.width !== undefined) img.set('width', obj.width)
                                    if (obj.height !== undefined) img.set('height', obj.height)

                                    // Restore clipPath for rounded corners
                                    if (obj.clipPath && obj.borderRadius) {
                                        const clipBorderRadius = obj.borderRadius / (obj.scaleX || 1)
                                        const clipPath = new fabric.Rect({
                                            width: obj.width,
                                            height: obj.height,
                                            rx: clipBorderRadius,
                                            ry: clipBorderRadius,
                                            left: -(obj.width) / 2,
                                            top: -(obj.height) / 2,
                                            originX: 'left',
                                            originY: 'top',
                                        })
                                        img.set('clipPath', clipPath)
                                    }

                                    img.set({ selectable: false, evented: false })
                                    fabricObj = img
                                } catch (err) {
                                    console.error('Error loading image:', err)
                                    return null
                                }
                            }
                            break
                        default:
                            return null
                    }

                    if (fabricObj) {
                        fabricObj.set({
                            selectable: false,
                            evented: false,
                        })
                        return fabricObj
                    }
                    return null
                } catch (error) {
                    console.error('Error creating fabric object:', error)
                    return null
                }
            })

            const loadedObjects = await Promise.all(objectPromises)
            loadedObjects.forEach(obj => {
                if (obj) canvas.add(obj)
            })

            canvas.renderAll()
        }

        loadSlideObjects()
    }, [slideData, isRendered])

    return (
        <canvas
            ref={setCanvasElement}
            className="w-full rounded border border-gray-300"
        />
    )
}

export function SlidesSidebar({
    slides,
    currentSlideIndex,
    onSlideClick,
    onAddSlide,
    onDuplicateSlide,
    onDeleteSlide,
    onMoveSlideUp,
    onMoveSlideDown
}: SlidesSidebarProps) {
    return (
        <div className="w-64 bg-gray-50 border-r border-gray-300 flex flex-col transition-all duration-300">
            <div className="p-4 border-b border-gray-300 flex-shrink-0">
                <Button className="w-full" onClick={onAddSlide}>
                    <Plus className="size-4 mr-2" />
                    New Slide
                </Button>
            </div>

            <ScrollArea className="flex-1 h-0">
                <div className="p-4 space-y-2">
                    {slides.map((slide, index) => {
                        return (
                            <div
                                key={slide.id}
                                className={`
                                    relative p-3 rounded-lg border-2 cursor-pointer transition-all
                                    ${index === currentSlideIndex
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                    }
                                `}
                                onClick={() => onSlideClick(index)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        Slide {index + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {index > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onMoveSlideUp(index)
                                                }}
                                                title="Mover arriba"
                                            >
                                                <ArrowUp className="size-3" />
                                            </Button>
                                        )}
                                        {index < slides.length - 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onMoveSlideDown(index)
                                                }}
                                                title="Mover abajo"
                                            >
                                                <ArrowDown className="size-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDuplicateSlide(index)
                                            }}
                                            title="Duplicar"
                                        >
                                            <Copy className="size-3" />
                                        </Button>
                                        {slides.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDeleteSlide(index)
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="aspect-video">
                                    <SlidePreview slideData={slide.data} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
