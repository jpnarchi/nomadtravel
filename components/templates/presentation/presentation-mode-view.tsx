/**
 * Vista de modo presentación fullscreen
 */

import { Button } from '@/components/ui/button'
import {
    Minimize,
    ChevronLeft,
    ChevronRight,
    SkipBack,
    SkipForward
} from 'lucide-react'

interface PresentationModeViewProps {
    currentSlideIndex: number
    totalSlides: number
    canvasElement: HTMLCanvasElement | null
    onCanvasMount: (el: HTMLCanvasElement | null) => void
    onToggleFullscreen: () => void
    onGoToSlide: (index: number) => void
    onPreviousSlide: () => void
    onNextSlide: () => void
}

export function PresentationModeView({
    currentSlideIndex,
    totalSlides,
    canvasElement,
    onCanvasMount,
    onToggleFullscreen,
    onGoToSlide,
    onPreviousSlide,
    onNextSlide
}: PresentationModeViewProps) {
    return (
        <div className="h-full w-full flex bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative">
            {/* Fullscreen Exit Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullscreen}
                className="absolute top-6 right-6 h-12 w-12 text-gray-900 hover:bg-gray-300/50 bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-xl rounded-2xl border border-gray-300 shadow-xl transition-all hover:scale-105 z-50"
            >
                <Minimize className="size-5 text-gray-900" />
            </Button>

            {/* Slide Counter */}
            <div className="absolute top-6 left-6 bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-xl rounded-2xl px-5 py-3 border border-gray-300 shadow-xl z-50">
                <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-sm font-bold">{currentSlideIndex + 1}</span>
                    <span className="text-gray-500 text-sm">/</span>
                    <span className="text-gray-700 text-sm">{totalSlides}</span>
                </div>
            </div>

            {/* Canvas Container - Centered */}
            <div className="flex-1 flex items-center justify-center">
                <canvas
                    ref={(el) => {
                        if (el && !canvasElement) {
                            onCanvasMount(el)
                        }
                    }}
                    className="shadow-2xl rounded-lg ring-1 ring-white/10"
                    style={{
                        display: 'block',
                        boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.2), 0 0 40px rgba(59, 130, 246, 0.1)',
                    }}
                />
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-gradient-to-r from-white/95 via-gray-50/95 to-white/95 backdrop-blur-2xl rounded-2xl px-6 py-3 shadow-2xl border border-gray-300 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onGoToSlide(0)}
                    disabled={currentSlideIndex === 0}
                    className="h-10 w-10 text-gray-900 hover:bg-gray-200/50 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                    <SkipBack className="size-5 text-gray-900" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPreviousSlide}
                    disabled={currentSlideIndex === 0}
                    className="h-11 w-11 text-gray-900 hover:bg-blue-100/50 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                    <ChevronLeft className="size-6 text-gray-900" />
                </Button>

                <div className="flex items-center gap-2 px-4 py-2 bg-gray-200/50 rounded-xl">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => onGoToSlide(index)}
                            className={`
                                h-2 rounded-full transition-all duration-300
                                ${index === currentSlideIndex
                                    ? 'w-10 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50'
                                    : 'w-2 bg-gray-400/60 hover:bg-gray-500 hover:w-4'
                                }
                            `}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNextSlide}
                    disabled={currentSlideIndex === totalSlides - 1}
                    className="h-11 w-11 text-gray-900 hover:bg-blue-100/50 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                    <ChevronRight className="size-6 text-gray-900" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onGoToSlide(totalSlides - 1)}
                    disabled={currentSlideIndex === totalSlides - 1}
                    className="h-10 w-10 text-gray-900 hover:bg-gray-200/50 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                    <SkipForward className="size-5 text-gray-900" />
                </Button>
            </div>
        </div>
    )
}
