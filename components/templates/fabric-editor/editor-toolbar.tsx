/**
 * Editor Toolbar - Barra superior de herramientas del editor
 */

import * as fabric from 'fabric'
import { Button } from '@/components/ui/button'
import {
    ZoomIn,
    ZoomOut,
    Scan,
    Lock,
    Unlock,
    Trash2,
    ArrowUp,
    ArrowDown,
    ChevronsUp,
    ChevronsDown,
} from 'lucide-react'

interface EditorToolbarProps {
    slideNumber: number
    totalSlides: number
    zoom: number
    selectedObject: fabric.FabricObject | null
    onZoomIn: () => void
    onZoomOut: () => void
    onFitToScreen: () => void
    onBringToFront: () => void
    onBringForward: () => void
    onSendBackward: () => void
    onSendToBack: () => void
    onToggleLock: () => void
    onDelete: () => void
}

export function EditorToolbar({
    slideNumber,
    totalSlides,
    zoom,
    selectedObject,
    onZoomIn,
    onZoomOut,
    onFitToScreen,
    onBringToFront,
    onBringForward,
    onSendBackward,
    onSendToBack,
    onToggleLock,
    onDelete,
}: EditorToolbarProps) {
    return (
        <div className="h-14 bg-gray-50 border-b border-gray-300 flex items-center justify-between px-4">
            <h3 className="text-sm font-semibold text-gray-900">Slide {slideNumber} of {totalSlides}</h3>

            <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onZoomOut}
                        className="h-7 w-7 text-gray-900 hover:text-gray-700"
                        title="Alejar"
                    >
                        <ZoomOut className="size-3.5" />
                    </Button>
                    <span className="text-gray-900 text-xs min-w-[45px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onZoomIn}
                        className="h-7 w-7 text-gray-900 hover:text-gray-700"
                        title="Acercar"
                    >
                        <ZoomIn className="size-3.5" />
                    </Button>
                    <div className="h-4 w-px bg-gray-400 mx-0.5" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onFitToScreen}
                        className="h-7 w-7 text-gray-900 hover:text-gray-700"
                        title="Ajustar"
                    >
                        <Scan className="size-3.5" />
                    </Button>
                </div>

                {/* Object Actions */}
                {selectedObject && (
                    <div className="flex items-center gap-1">
                        {/* Layer Controls */}
                        <div className="flex items-center gap-0.5 px-1 py-0.5 bg-gray-100 rounded-md">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onBringToFront}
                                className="h-7 w-7 text-gray-900 hover:text-gray-700"
                                title="Traer al frente"
                            >
                                <ChevronsUp className="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onBringForward}
                                className="h-7 w-7 text-gray-900 hover:text-gray-700"
                                title="Traer adelante"
                            >
                                <ArrowUp className="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSendBackward}
                                className="h-7 w-7 text-gray-900 hover:text-gray-700"
                                title="Enviar atrás"
                            >
                                <ArrowDown className="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSendToBack}
                                className="h-7 w-7 text-gray-900 hover:text-gray-700"
                                title="Enviar al fondo"
                            >
                                <ChevronsDown className="size-3.5" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleLock}
                            className="h-8 w-8 text-gray-900 hover:text-gray-700"
                            title={selectedObject.lockMovementX ? 'Desbloquear' : 'Bloquear'}
                        >
                            {selectedObject.lockMovementX ? (
                                <Unlock className="size-4" />
                            ) : (
                                <Lock className="size-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            className="h-8 w-8 text-gray-900 hover:text-gray-700 hover:bg-red-100"
                            title="Eliminar"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
