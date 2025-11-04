'use client'

/**
 * Panel de Últimas Presentaciones
 *
 * Muestra las últimas 6 presentaciones creadas por el usuario
 * Cada presentación muestra su primer slide renderizado con Fabric.js
 */

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import * as fabric from 'fabric'
import { useRouter } from 'next/navigation'
import { Presentation, Clock, ArrowRight, ChevronRight, Search, ArrowUpDown } from 'lucide-react'
import { motion } from 'framer-motion'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SlideCanvasProps {
    slideContent: string | null
    title: string
    chatId: Id<"chats">
    createdAt: number
    index: number
}

function SlideCanvas({ slideContent, title, chatId, createdAt, index }: SlideCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (!canvasRef.current || !slideContent) return

        // Parse slide content
        let slideData
        try {
            slideData = JSON.parse(slideContent)
        } catch (error) {
            console.error('Error parsing slide content:', error)
            return
        }

        // Initialize canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 384, // 24rem in pixels (scaled down from 1920)
            height: 216, // 13.5rem in pixels (scaled down from 1080, maintaining 16:9)
            backgroundColor: slideData.background || '#1a1a1a',
            selection: false,
        })

        fabricCanvasRef.current = canvas

        // Load objects
        const loadSlideObjects = async () => {
            if (!slideData.objects || !Array.isArray(slideData.objects)) {
                canvas.renderAll()
                setIsLoaded(true)
                return
            }

            // Sort by zIndex
            const sortedObjects = [...slideData.objects].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            // Create promises for all objects
            const objectPromises = sortedObjects.map(async (obj: any) => {
                try {
                    const objType = (obj.type || '').toLowerCase()
                    let fabricObj: fabric.FabricObject | null = null

                    // Scale factor from 1920x1080 to 384x216
                    const scale = 384 / 1920

                    switch (objType) {
                        case 'text':
                        case 'i-text':
                        case 'itext':
                        case 'textbox':
                            if (obj.width) {
                                fabricObj = new fabric.Textbox(obj.text || 'Text', {
                                    left: (obj.left || 0) * scale,
                                    top: (obj.top || 0) * scale,
                                    width: (obj.width || 100) * scale,
                                    fontSize: (obj.fontSize || 40) * scale,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                })
                            } else {
                                fabricObj = new fabric.IText(obj.text || 'Text', {
                                    left: (obj.left || 0) * scale,
                                    top: (obj.top || 0) * scale,
                                    fontSize: (obj.fontSize || 40) * scale,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                })
                            }
                            if (obj.originX) fabricObj.set('originX', obj.originX)
                            if (obj.originY) fabricObj.set('originY', obj.originY)
                            if (obj.angle !== undefined) fabricObj.set('angle', obj.angle)
                            if (obj.scaleX !== undefined) fabricObj.set('scaleX', obj.scaleX * scale)
                            if (obj.scaleY !== undefined) fabricObj.set('scaleY', obj.scaleY * scale)
                            break

                        case 'rect':
                        case 'rectangle':
                            fabricObj = new fabric.Rect({
                                left: (obj.left || 0) * scale,
                                top: (obj.top || 0) * scale,
                                width: (obj.width || 100) * scale,
                                height: (obj.height || 100) * scale,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: (obj.strokeWidth || 0) * scale,
                                rx: (obj.rx || 0) * scale,
                                ry: (obj.ry || 0) * scale,
                                angle: obj.angle || 0,
                                scaleX: (obj.scaleX || 1) * scale,
                                scaleY: (obj.scaleY || 1) * scale,
                            })
                            break

                        case 'circle':
                            fabricObj = new fabric.Circle({
                                left: (obj.left || 0) * scale,
                                top: (obj.top || 0) * scale,
                                radius: (obj.radius || 50) * scale,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: (obj.strokeWidth || 0) * scale,
                                angle: obj.angle || 0,
                                scaleX: (obj.scaleX || 1) * scale,
                                scaleY: (obj.scaleY || 1) * scale,
                            })
                            break

                        case 'triangle':
                            fabricObj = new fabric.Triangle({
                                left: (obj.left || 0) * scale,
                                top: (obj.top || 0) * scale,
                                width: (obj.width || 100) * scale,
                                height: (obj.height || 100) * scale,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: (obj.strokeWidth || 0) * scale,
                                angle: obj.angle || 0,
                                scaleX: (obj.scaleX || 1) * scale,
                                scaleY: (obj.scaleY || 1) * scale,
                            })
                            break

                        case 'line':
                            fabricObj = new fabric.Line(
                                [
                                    (obj.x1 || 0) * scale,
                                    (obj.y1 || 0) * scale,
                                    (obj.x2 || 100) * scale,
                                    (obj.y2 || 100) * scale
                                ],
                                {
                                    stroke: obj.stroke || '#000000',
                                    strokeWidth: (obj.strokeWidth || 1) * scale,
                                }
                            )
                            break

                        case 'image':
                            if (obj.src) {
                                try {
                                    const img = await fabric.FabricImage.fromURL(obj.src, { crossOrigin: 'anonymous' })
                                    if (obj.left !== undefined) img.set('left', obj.left * scale)
                                    if (obj.top !== undefined) img.set('top', obj.top * scale)
                                    if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX * scale)
                                    if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY * scale)
                                    if (obj.angle !== undefined) img.set('angle', obj.angle)
                                    img.set({ selectable: false, evented: false })
                                    fabricObj = img
                                } catch (err) {
                                    console.error('Error loading image:', err)
                                    return null
                                }
                            }
                            break

                        default:
                            console.warn(`Unknown object type: ${obj.type}`)
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
            loadedObjects.forEach((obj) => {
                if (obj) canvas.add(obj)
            })

            canvas.renderAll()
            setIsLoaded(true)
        }

        loadSlideObjects()

        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose()
                fabricCanvasRef.current = null
            }
        }
    }, [slideContent])

    const handleClick = () => {
        router.push(`/chat/${chatId}`)
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Hoy'
        if (diffDays === 1) return 'Ayer'
        if (diffDays < 7) return `Hace ${diffDays} días`
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onClick={handleClick}
            className="group relative bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
        >
            {/* Canvas Container */}
            <div className="relative aspect-video bg-zinc-900/50 flex items-center justify-center overflow-hidden">
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white font-medium">
                        <span>Abrir presentación</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 space-y-2">
                <h3 className="text-white font-semibold text-base line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {title}
                </h3>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                        <Presentation className="w-3.5 h-3.5" />
                        <span>Ver detalles</span>
                    </div>
                </div>
            </div>

            {/* Corner Badge */}
            <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg">
                <span className="text-white text-xs font-bold">#{index + 1}</span>
            </div>
        </motion.div>
    )
}

export function ProjectsPreviewHero() {
    const allPresentations = useQuery(api.chats.getAllPresentationsWithFirstSlide)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'lastEdited' | 'dateCreated' | 'alphabetical'>('lastEdited')

    // Filter and sort presentations
    const filteredAndSortedPresentations = allPresentations
        ? allPresentations
            .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                switch (sortBy) {
                    case 'lastEdited':
                        return b.createdAt - a.createdAt
                    case 'dateCreated':
                        return b.createdAt - a.createdAt
                    case 'alphabetical':
                        return a.title.localeCompare(b.title)
                    default:
                        return 0
                }
            })
            .slice(0, 6) // Always show maximum 6 presentations
        : []

    if (!allPresentations) {
        return (
            <div className="w-full py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (allPresentations.length === 0) {
        return (
            <div className="w-full py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <Presentation className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-700 mb-2">
                            No hay presentaciones aún
                        </h3>
                        <p className="text-zinc-500">
                            Crea tu primera presentación para verla aquí
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full px-4 -mt-32">
            <div className="max-w-7xl mx-auto bg-white p-8 rounded-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-black text-xl sm:text-xl md:text-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center font-bold">
                            <span>Your last</span>
                                <span className="flex items-center gap-2 sm:gap-3">
                                     <img src="/logo.svg" alt="Logo" className="h-8 sm:h-10 md:h-8 inline-block" /> Presentations
                                </span>
                        </div>
                        <p className="flex text-xl text-black/70 items-center cursor-pointer hover:text-blue-500 transition-colors">
                            View all
                            <ChevronRight className='h-5 w-5 ml-1'/>
                        </p>
                    </div>

                    {/* Search and Sort Controls */}
                    <div className="flex items-center gap-4 mb-6">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                type="text"
                                placeholder="Search presentations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-zinc-50 border-zinc-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 shrink-0">
                                    <ArrowUpDown className="h-4 w-4" />
                                    <span className="hidden sm:inline">Sort by:</span>
                                    <span className="font-semibold">
                                        {sortBy === 'lastEdited' && 'Last edited'}
                                        {sortBy === 'dateCreated' && 'Date created'}
                                        {sortBy === 'alphabetical' && 'Alphabetical'}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border border-zinc-200 shadow-lg z-[9999]">
                                <DropdownMenuItem
                                    onClick={() => setSortBy('lastEdited')}
                                    className={`cursor-pointer ${sortBy === 'lastEdited' ? 'bg-blue-50 text-blue-600' : ''}`}
                                >
                                    Last edited
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy('dateCreated')}
                                    className={`cursor-pointer ${sortBy === 'dateCreated' ? 'bg-blue-50 text-blue-600' : ''}`}
                                >
                                    Date created
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy('alphabetical')}
                                    className={`cursor-pointer ${sortBy === 'alphabetical' ? 'bg-blue-50 text-blue-600' : ''}`}
                                >
                                    Alphabetical
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                </motion.div>

                {/* Grid */}
                {filteredAndSortedPresentations.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                        <p className="text-zinc-500 text-lg">No presentations found matching "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedPresentations.map((presentation, index) => (
                            <SlideCanvas
                                key={presentation.chatId}
                                slideContent={presentation.firstSlideContent}
                                title={presentation.title}
                                chatId={presentation.chatId}
                                createdAt={presentation.createdAt}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
