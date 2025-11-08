import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Presentation, X } from 'lucide-react'

interface ThumbnailsSidebarProps {
    slides: any[]
    currentSlide: number
    onSlideClick: (index: number) => void
    onClose: () => void
}

export function ThumbnailsSidebar({
    slides,
    currentSlide,
    onSlideClick,
    onClose
}: ThumbnailsSidebarProps) {
    return (
        <div className="w-64 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl border-r border-zinc-700/50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-zinc-700/50 flex items-center justify-between bg-zinc-800/30">
                <div className="flex items-center gap-2">
                    <Presentation className="size-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Slides</h3>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/10 transition-all"
                            onClick={onClose}
                        >
                            <X className="size-4 text-white" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Hide thumbnails (T)</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="p-3 space-y-3">
                    {slides.map((slide, index) => (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <div
                                    onClick={() => onSlideClick(index)}
                                    className={`
                                        group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-300
                                        ${index === currentSlide
                                            ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 scale-105'
                                            : 'border-zinc-700/50 hover:border-blue-400/50 hover:shadow-lg hover:scale-102'
                                        }
                                    `}
                                >
                                    <div
                                        className="aspect-video flex items-center justify-center text-xs font-medium relative"
                                        style={{ backgroundColor: slide.background || '#ffffff' }}
                                    >
                                        {/* Slide number badge */}
                                        <div className="absolute top-2 left-2 bg-gradient-to-br from-blue-500 to-blue-600 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg">
                                            <span className="text-white text-xs font-bold">
                                                {index + 1}
                                            </span>
                                        </div>

                                        {/* Object count */}
                                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                                            <span className="text-zinc-200 text-[10px]">
                                                {slide.objects?.length || 0} obj
                                            </span>
                                        </div>

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Center text */}
                                        <span className="text-white text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                                            Click to view
                                        </span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Slide {index + 1} - {slide.objects?.length || 0} objects</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
