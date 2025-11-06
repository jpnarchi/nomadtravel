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
    Upload,
    Image as ImageIcon,
    Shapes,
    Star,
    Pentagon,
    Hexagon,
    Minus,
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
    onShowImageUrlDialog: () => void
}

export function ToolsSidebar({
    onAddText,
    onAddRectangle,
    onAddCircle,
    onAddTriangle,
    onAddLine,
    onFileSelect,
    onShowImageUrlDialog,
}: ToolsSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onFileSelect(file)
        }
    }

    return (
        <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={onAddText}
                className="h-12 w-12 text-white hover:text-white hover:bg-zinc-800"
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
                        className="h-12 w-12 text-white hover:text-white hover:bg-zinc-800"
                        title="Formas"
                    >
                        <Shapes className="size-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48 bg-zinc-900 border-zinc-800">
                    <DropdownMenuItem
                        onClick={onAddRectangle}
                        className="text-white hover:text-white hover:bg-zinc-800 cursor-pointer"
                    >
                        <Square className="size-4 mr-2" />
                        Rectangle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onAddCircle}
                        className="text-white hover:text-white hover:bg-zinc-800 cursor-pointer"
                    >
                        <Circle className="size-4 mr-2" />
                        Circle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onAddTriangle}
                        className="text-white hover:text-white hover:bg-zinc-800 cursor-pointer"
                    >
                        <Triangle className="size-4 mr-2" />
                        Triangle
                    </DropdownMenuItem>
                    {onAddLine && (
                        <>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                                onClick={onAddLine}
                                className="text-white hover:text-white hover:bg-zinc-800 cursor-pointer"
                            >
                                <Minus className="size-4 mr-2" />
                                Line
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-px w-8 bg-zinc-700 my-2" />

            {/* <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 text-white hover:text-white hover:bg-zinc-800"
                title="Subir Imagen"
            >
                <Upload className="size-5" />
            </Button> */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onShowImageUrlDialog}
                className="h-12 w-12 text-white hover:text-white hover:bg-zinc-800"
                title="Imagen desde URL"
            >
                <ImageIcon className="size-5" />
            </Button>

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
