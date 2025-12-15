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
                        const objectCount = slide.data.objects?.length || 0
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
                                <div
                                    className="aspect-video rounded border border-gray-300 flex items-center justify-center text-xs"
                                    style={{ backgroundColor: slide.data.background || '#ffffff' }}
                                >
                                    <span className="font-medium text-gray-600">
                                        {objectCount} {objectCount === 1 ? 'object' : 'objects'}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
