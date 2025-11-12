/**
 * Tools Sidebar - Barra lateral de herramientas
 */

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
    Type,
    Square,
    Circle,
    Triangle,
    Image as ImageIcon,
    Shapes,
    Star,
    Pentagon,
    Hexagon,
    Minus,
    PanelLeftClose,
    PanelLeftOpen,
    ImagePlus,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface ToolsSidebarProps {
    onAddText: () => void
    onAddRectangle: () => void
    onAddCircle: () => void
    onAddTriangle: () => void
    onAddLine?: () => void
    onFileSelect: (file: File) => void
    onShowUploadDialog?: () => void
    onAddImagePlaceholder?: () => void
    isSidebarCollapsed?: boolean
    onToggleSidebar?: () => void
}

export function ToolsSidebar({
    onAddText,
    onAddRectangle,
    onAddCircle,
    onAddTriangle,
    onAddLine,
    onFileSelect,
    onShowUploadDialog,
    onAddImagePlaceholder,
    isSidebarCollapsed,
    onToggleSidebar,
}: ToolsSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onFileSelect(file)
        }
    }

    return (
        <div className="w-16 bg-gray-50 border-r border-gray-300 flex flex-col items-center py-4 gap-2">
            {onToggleSidebar && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="h-12 w-12 text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                    title={isSidebarCollapsed ? "Show slides sidebar" : "Hide slides sidebar"}
                >
                    {isSidebarCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
                </Button>
            )}

        <div className="h-px w-8 bg-gray-300 my-2" />

            <Button
                variant="ghost"
                size="icon"
                onClick={onAddText}
                className="h-12 w-12 text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                title="Agregar Texto"
            >
                <Type className="size-5" />
            </Button>

            {/* Shapes Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                        title="Formas"
                    >
                        <Shapes className="size-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48 bg-white border-gray-300">
                    <DropdownMenuItem
                        onClick={onAddRectangle}
                        className="text-gray-900 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    >
                        <Square className="size-4 mr-2" />
                        Rectangle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onAddCircle}
                        className="text-gray-900 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    >
                        <Circle className="size-4 mr-2" />
                        Circle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onAddTriangle}
                        className="text-gray-900 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    >
                        <Triangle className="size-4 mr-2" />
                        Triangle
                    </DropdownMenuItem>
                    {onAddLine && (
                        <>
                            <DropdownMenuSeparator className="bg-gray-300" />
                            <DropdownMenuItem
                                onClick={onAddLine}
                                className="text-gray-900 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                            >
                                <Minus className="size-4 mr-2" />
                                Line
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-px w-8 bg-gray-300 my-2" />

            {onShowUploadDialog && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onShowUploadDialog}
                    className="h-12 w-12 text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                    title="Subir Imagen"
                >
                    <ImageIcon className="size-5" />
                </Button>
            )}

            {onAddImagePlaceholder && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onAddImagePlaceholder}
                    className="h-12 w-12 text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                    title="Contenedor de Imagen"
                >
                    <ImagePlus className="size-5" />
                </Button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    )
}
