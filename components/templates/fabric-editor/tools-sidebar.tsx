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
} from 'lucide-react'

interface ToolsSidebarProps {
    onAddText: () => void
    onAddRectangle: () => void
    onAddCircle: () => void
    onAddTriangle: () => void
    onFileSelect: (file: File) => void
    onShowImageUrlDialog: () => void
}

export function ToolsSidebar({
    onAddText,
    onAddRectangle,
    onAddCircle,
    onAddTriangle,
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
                className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                title="Agregar Texto"
            >
                <Type className="size-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onAddRectangle}
                className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                title="Agregar Rectángulo"
            >
                <Square className="size-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onAddCircle}
                className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                title="Agregar Círculo"
            >
                <Circle className="size-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onAddTriangle}
                className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                title="Agregar Triángulo"
            >
                <Triangle className="size-5" />
            </Button>

            <div className="h-px w-8 bg-zinc-700 my-2" />

            <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
                title="Subir Imagen"
            >
                <Upload className="size-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onShowImageUrlDialog}
                className="h-12 w-12 text-white hover:text-black hover:bg-zinc-800"
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
