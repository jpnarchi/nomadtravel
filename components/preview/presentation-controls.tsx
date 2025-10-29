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
        <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Palette className="size-4 text-muted-foreground" />
                            <Select
                                value={currentTheme}
                                onValueChange={(value) => onThemeChange(value as RevealTheme)}
                            >
                                <SelectTrigger className="w-[130px] h-9">
                                    <SelectValue placeholder="Tema" />
                                </SelectTrigger>
                                <SelectContent>
                                    {themes.map((theme) => (
                                        <SelectItem key={theme.value} value={theme.value}>
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

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-muted-foreground" />
                            <Select
                                value={currentTransition}
                                onValueChange={(value) => onTransitionChange(value as RevealTransition)}
                            >
                                <SelectTrigger className="w-[130px] h-9">
                                    <SelectValue placeholder="Transición" />
                                </SelectTrigger>
                                <SelectContent>
                                    {transitions.map((transition) => (
                                        <SelectItem key={transition.value} value={transition.value}>
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

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onFullscreen}
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
                            variant="outline"
                            onClick={onExportPDF}
                        >
                            <Download className="size-4" />
                            PDF
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Exportar a PDF</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
