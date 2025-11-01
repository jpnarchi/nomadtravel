'use client'

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Palette, Zap, Download, Maximize } from "lucide-react"

export type RevealTheme =
    | "black"
    | "white"
    | "league"
    | "sky"
    | "beige"
    | "simple"
    | "serif"
    | "blood"
    | "night"
    | "moon"
    | "solarized"

export type RevealTransition =
    | "none"
    | "fade"
    | "slide"
    | "convex"
    | "concave"
    | "zoom"

interface PresentationControlsProps {
    onThemeChange: (theme: RevealTheme) => void
    onTransitionChange: (transition: RevealTransition) => void
    onExportPDF: () => void
    onFullscreen: () => void
    currentTheme: RevealTheme
    currentTransition: RevealTransition
}

const themes: { value: RevealTheme; label: string }[] = [
    { value: "black", label: "Negro" },
]

const transitions: { value: RevealTransition; label: string }[] = [
    { value: "none", label: "Ninguna" },
    // { value: "fade", label: "Fade" },
    // { value: "slide", label: "Slide" },
    // { value: "convex", label: "Convex" },
    // { value: "concave", label: "Concave" },
    // { value: "zoom", label: "Zoom" },
]

export function PresentationControls({
    onThemeChange,
    onTransitionChange,
    onExportPDF,
    onFullscreen,
    currentTheme,
    currentTransition,
}: PresentationControlsProps) {
    return (
        <div className="flex items-center justify-center w-full">
            <div className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-zinc-700/50">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5 border border-zinc-700/50">
                            <Palette className="size-4 text-blue-400" />
                            <Select
                                value={currentTheme}
                                onValueChange={(value) => onThemeChange(value as RevealTheme)}
                            >
                                <SelectTrigger className="w-[130px] h-8 border-0 bg-transparent focus:ring-0">
                                    <SelectValue placeholder="Tema" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700">
                                    {themes.map((theme) => (
                                        <SelectItem
                                            key={theme.value}
                                            value={theme.value}
                                            className="hover:bg-zinc-800 focus:bg-zinc-800"
                                        >
                                            {theme.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Cambiar tema de presentación</p>
                    </TooltipContent>
                </Tooltip>

                <div className="h-8 w-px bg-zinc-700/50" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5 border border-zinc-700/50">
                            <Zap className="size-4 text-yellow-400" />
                            <Select
                                value={currentTransition}
                                onValueChange={(value) => onTransitionChange(value as RevealTransition)}
                            >
                                <SelectTrigger className="w-[130px] h-8 border-0 bg-transparent focus:ring-0">
                                    <SelectValue placeholder="Transición" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700">
                                    {transitions.map((transition) => (
                                        <SelectItem
                                            key={transition.value}
                                            value={transition.value}
                                            className="hover:bg-zinc-800 focus:bg-zinc-800"
                                        >
                                            {transition.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Cambiar efecto de transición</p>
                    </TooltipContent>
                </Tooltip>

                <div className="h-8 w-px bg-zinc-700/50" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onFullscreen}
                            className="h-9 w-9 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-all"
                        >
                            <Maximize className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Pantalla completa (F)</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onExportPDF}
                            className="h-9 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-all px-3"
                        >
                            <Download className="size-4 mr-2" />
                            PDF
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Exportar a PDF</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </div>
        </div>
    )
}
