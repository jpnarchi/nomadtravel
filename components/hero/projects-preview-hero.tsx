'use client'

/**
 * Panel de Últimas Presentaciones
 *
 * Muestra las últimas 6 presentaciones creadas por el usuario
 * Cada presentación muestra su primer slide renderizado con Fabric.js
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import * as fabric from 'fabric'
import { useRouter } from 'next/navigation'
import { Presentation, Clock, ArrowRight, ChevronRight, Search, ArrowUpDown, Check, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from "@/components/ai-elements/loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Doc } from "@/convex/_generated/dataModel"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AspectRatioType, DEFAULT_ASPECT_RATIO, getAspectRatioDimensions } from '@/lib/aspect-ratios'

interface SlideCanvasProps {
    chatId: Id<"chats">
    version: number
    title: string
    createdAt: number
    index: number
    userInfo: Doc<"users"> | null
    onRename: (chatId: Id<"chats">, currentTitle: string) => void
    onDelete: (chatId: Id<"chats">, title: string) => void
}


function SlideCanvas({ chatId, version, title, createdAt, index, userInfo, onRename, onDelete }: SlideCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const router = useRouter()

    // Get all files for this presentation
    const files = useQuery(api.files.getAll, { chatId, version })

    // Extract aspect ratio from presentation config - MEMOIZED
    const aspectRatio = useMemo(() => {
        if (!files) return DEFAULT_ASPECT_RATIO;

        const configPath = '/presentation-config.json';
        const configFile = files[configPath];

        if (configFile) {
            try {
                const config = JSON.parse(configFile);
                return config.aspectRatio || DEFAULT_ASPECT_RATIO;
            } catch (error) {
                console.error('Error parsing presentation config:', error);
                return DEFAULT_ASPECT_RATIO;
            }
        }

        return DEFAULT_ASPECT_RATIO;
    }, [files]);

    // Get aspect ratio dimensions - MEMOIZED
    const aspectRatioDimensions = useMemo(() => {
        return getAspectRatioDimensions(aspectRatio);
    }, [aspectRatio]);

    // Debug: Log user info to check pictureUrl
    useEffect(() => {
        if (userInfo) {
            console.log('User Info:', {
                name: userInfo.name,
                pictureUrl: userInfo.pictureUrl,
                email: userInfo.email
            })
        }
    }, [userInfo])

    // Extract first slide from files
    const firstSlide = useMemo(() => {
        if (!files) return null;

        const slideFile = Object.entries(files)
            .filter(([path]) => path.startsWith('/slides/') && path.endsWith('.json'))
            .sort((a, b) => {
                const numA = parseInt(a[0].match(/slide-(\d+)\.json$/)?.[1] || '0');
                const numB = parseInt(b[0].match(/slide-(\d+)\.json$/)?.[1] || '0');
                return numA - numB;
            })
            .map(([_, content]) => {
                try {
                    return JSON.parse(content);
                } catch {
                    return null;
                }
            })
            .filter(slide => slide !== null)[0];

        return slideFile || null;
    }, [files]);

    useEffect(() => {
        if (!canvasRef.current || !firstSlide || !files) return

        // Calculate thumbnail size based on aspect ratio
        // Define max container dimensions to keep grid consistent
        const maxWidth = 384;
        const maxHeight = 280; // Altura máxima razonable para el grid

        let thumbnailWidth: number;
        let thumbnailHeight: number;

        // For vertical aspect ratios (like A4), limit by height
        // For horizontal aspect ratios, limit by width
        if (aspectRatioDimensions.ratio < 1) {
            // Vertical: altura es mayor que ancho
            thumbnailHeight = maxHeight;
            thumbnailWidth = Math.round(thumbnailHeight * aspectRatioDimensions.ratio);
        } else {
            // Horizontal or square: ancho es mayor o igual que altura
            thumbnailWidth = maxWidth;
            thumbnailHeight = Math.round(thumbnailWidth / aspectRatioDimensions.ratio);

            // Si la altura calculada excede el máximo, recalcular limitando por altura
            if (thumbnailHeight > maxHeight) {
                thumbnailHeight = maxHeight;
                thumbnailWidth = Math.round(thumbnailHeight * aspectRatioDimensions.ratio);
            }
        }

        // Initialize canvas with scaled dimensions
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: thumbnailWidth,
            height: thumbnailHeight,
            backgroundColor: firstSlide.background || '#1a1a1a',
            selection: false,
        })

        // Scale from original dimensions to thumbnail
        const scale = thumbnailWidth / aspectRatioDimensions.width;
        canvas.setZoom(scale)
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0]

        fabricCanvasRef.current = canvas

        // Load objects
        const loadSlideObjects = async () => {
            if (!firstSlide.objects || !Array.isArray(firstSlide.objects)) {
                canvas.renderAll()
                setIsLoaded(true)
                return
            }

            // Sort by zIndex
            const sortedObjects = [...firstSlide.objects].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            // Create promises for all objects
            const objectPromises = sortedObjects.map(async (obj: any) => {
                try {
                    const objType = (obj.type || '').toLowerCase()
                    let fabricObj: fabric.FabricObject | null = null

                    switch (objType) {
                        case 'text':
                        case 'i-text':
                        case 'itext':
                        case 'textbox':
                            // Use original coordinates - viewport transform will scale them
                            if (obj.width) {
                                fabricObj = new fabric.Textbox(obj.text || 'Text', {
                                    left: obj.left || 0,
                                    top: obj.top || 0,
                                    width: obj.width || 100,
                                    fontSize: obj.fontSize || 40,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    fontStyle: obj.fontStyle || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                    lineHeight: obj.lineHeight,
                                    charSpacing: obj.charSpacing,
                                    originX: obj.originX,
                                    originY: obj.originY,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                })
                            } else {
                                fabricObj = new fabric.IText(obj.text || 'Text', {
                                    left: obj.left || 0,
                                    top: obj.top || 0,
                                    fontSize: obj.fontSize || 40,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    fontStyle: obj.fontStyle || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                    lineHeight: obj.lineHeight,
                                    charSpacing: obj.charSpacing,
                                    originX: obj.originX,
                                    originY: obj.originY,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                })
                            }
                            break

                        case 'rect':
                        case 'rectangle':
                            fabricObj = new fabric.Rect({
                                left: obj.left || 0,
                                top: obj.top || 0,
                                width: obj.width || 100,
                                height: obj.height || 100,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                rx: obj.rx || 0,
                                ry: obj.ry || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break

                        case 'circle':
                            fabricObj = new fabric.Circle({
                                left: obj.left || 0,
                                top: obj.top || 0,
                                radius: obj.radius || 50,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break

                        case 'triangle':
                            fabricObj = new fabric.Triangle({
                                left: obj.left || 0,
                                top: obj.top || 0,
                                width: obj.width || 100,
                                height: obj.height || 100,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break

                        case 'line':
                            // Use fromObject to properly restore all line properties
                            // This ensures strokeLineCap, transformations, etc. are preserved
                            fabricObj = await fabric.Line.fromObject(obj);
                            break

                        case 'group':
                            // Handle groups (like image placeholders)
                            try {
                                fabricObj = await fabric.Group.fromObject(obj);
                            } catch (err) {
                                console.error('Error loading group:', err);
                                return null;
                            }
                            break
                        case 'image':
                            if (obj.src) {
                                try {
                                    const img = await fabric.FabricImage.fromURL(obj.src, { crossOrigin: 'anonymous' });
                                    if (obj.left !== undefined) img.set('left', obj.left);
                                    if (obj.top !== undefined) img.set('top', obj.top);
                                    if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX);
                                    if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY);
                                    if (obj.angle !== undefined) img.set('angle', obj.angle);
                                    if (obj.originX !== undefined) img.set('originX', obj.originX);
                                    if (obj.originY !== undefined) img.set('originY', obj.originY);

                                    // Restore crop properties for image containers
                                    if (obj.cropX !== undefined) (img as any).cropX = obj.cropX;
                                    if (obj.cropY !== undefined) (img as any).cropY = obj.cropY;
                                    if (obj.width !== undefined) img.set('width', obj.width);
                                    if (obj.height !== undefined) img.set('height', obj.height);

                                    // Restore clipPath for rounded corners
                                    if (obj.clipPath && obj.borderRadius) {
                                        const clipBorderRadius = obj.borderRadius / (obj.scaleX || 1);
                                        const clipPath = new fabric.Rect({
                                            width: obj.width,
                                            height: obj.height,
                                            rx: clipBorderRadius,
                                            ry: clipBorderRadius,
                                            left: -(obj.width) / 2,
                                            top: -(obj.height) / 2,
                                            originX: 'left',
                                            originY: 'top',
                                        });
                                        img.set('clipPath', clipPath);
                                    }

                                    img.set({ selectable: false, evented: false });
                                    fabricObj = img;
                                } catch (err) {
                                    console.error('Error loading image:', err);
                                    return null;
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
    }, [firstSlide, aspectRatioDimensions])

    const handleClick = () => {
        router.push(`/chat/${chatId}`)
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffMinutes < 1) return 'Last edited just now'
        if (diffMinutes < 60) return `Last edited ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
        if (diffHours < 24) return `Last edited ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
        if (diffDays === 1) return 'Last edited yesterday'
        if (diffDays < 7) return `Last edited ${diffDays} days ago`
        if (diffDays < 30) return `Last edited ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`
        return `Last edited on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onClick={handleClick}
            className="group relative rounded-xl sm:rounded-2xl cursor-pointer"
        >
            {/* Canvas Container */}
            <div className="relative bg-white flex items-center justify-center overflow-hidden rounded-t-xl sm:rounded-t-2xl" style={{ minHeight: '280px', height: '280px' }}>
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 pointer-events-none">
                        <span> Preview not available...</span>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className={`transition-opacity duration-300 pointer-events-none ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                />
            </div>

            {/* Info Section */}
            <div className="p-3 -mt-4 sm:p-4 space-y-2 sm:space-y-3 bg-white rounded-b-xl sm:rounded-b-2xl cursor-pointer">
                <div className="flex items-start gap-2 sm:gap-3">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 pointer-events-none">
                        <AvatarImage src={userInfo?.pictureUrl} alt={userInfo?.name || 'User'} />
                        <AvatarFallback className="bg-blue-500 text-white font-semibold text-xs sm:text-sm">
                            {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-black pointer-events-none">
                        <h3 className="text-sm sm:text-base line-clamp-1 group-hover:text-blue-400 transition-colors font-[family-name:var(--font-ppmori-semibold)]">
                            {title}
                        </h3>
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="line-clamp-1">{formatDate(createdAt)}</span>
                        </div>
                    </div>

                    {/* 3-dot menu button */}
                    <div className="relative self-end z-10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-zinc-100"
                            onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpen(!menuOpen)
                            }}
                        >
                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                        </Button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {menuOpen && (
                                <>
                                    {/* Backdrop to close menu */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setMenuOpen(false)
                                        }}
                                    />

                                    {/* Menu */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute top-10 right-0 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-[999] overflow-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setMenuOpen(false)
                                                    onRename(chatId, title)
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 transition-colors flex items-center gap-2 text-zinc-700"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span>Rename presentation</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setMenuOpen(false)
                                                    onDelete(chatId, title)
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export function ProjectsPreviewHero() {
    const allPresentations = useQuery(api.chats.getAllPresentationsWithFirstSlide)
    const userInfo = useQuery(api.users.getUserInfo)
    const updateTitle = useMutation(api.chats.updateTitle)
    const deleteChat = useMutation(api.chats.deleteChat)

    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'lastEdited' | 'dateCreated' | 'alphabetical'>('lastEdited')
    const [dropdownOpen, setDropdownOpen] = useState(false)

    // Rename dialog state
    const [renameDialogOpen, setRenameDialogOpen] = useState(false)
    const [renameChatId, setRenameChatId] = useState<Id<"chats"> | null>(null)
    const [renameCurrentTitle, setRenameCurrentTitle] = useState('')
    const [newTitle, setNewTitle] = useState('')

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteChatId, setDeleteChatId] = useState<Id<"chats"> | null>(null)
    const [deleteTitle, setDeleteTitle] = useState('')

    // Handler to open rename dialog
    const handleRename = (chatId: Id<"chats">, currentTitle: string) => {
        setRenameChatId(chatId)
        setRenameCurrentTitle(currentTitle)
        setNewTitle(currentTitle)
        setRenameDialogOpen(true)
    }

    // Handler to confirm rename
    const handleConfirmRename = async () => {
        if (renameChatId && newTitle.trim() && newTitle !== renameCurrentTitle) {
            try {
                await updateTitle({ chatId: renameChatId, title: newTitle })
                setRenameDialogOpen(false)
            } catch (error) {
                console.error('Error renaming presentation:', error)
            }
        }
    }

    // Handler to open delete dialog
    const handleDelete = (chatId: Id<"chats">, title: string) => {
        setDeleteChatId(chatId)
        setDeleteTitle(title)
        setDeleteDialogOpen(true)
    }

    // Handler to confirm delete
    const handleConfirmDelete = async () => {
        console.log('[DELETE] Button clicked!', deleteChatId)
        if (deleteChatId) {
            try {
                console.log('[DELETE] Calling deleteChat mutation...')
                await deleteChat({ chatId: deleteChatId })
                console.log('[DELETE] Success! Closing dialog...')
                setDeleteDialogOpen(false)
            } catch (error) {
                console.error('[DELETE] Error deleting presentation:', error)
            }
        }
    }

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
            <div className="w-full py-8 sm:py-16 px-3 sm:px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-8 sm:py-12">
                        <Loader className="size-8 sm:size-10" />
                    </div>
                </div>
            </div>
        )
    }

    if (allPresentations.length === 0) {
        return (
            null
        )
    }

    return (
        <div className="w-full px-3 sm:px-4 -mt-32 sm:-mt-32 mb-20">
            <div className="max-w-7xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 sm:mb-8 md:mb-12"
                >
                    <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                        <div className="text-black text-lg sm:text-xl md:text-2xl flex flex-wrap items-center gap-2 font-semibold">
                            <span>Your last</span>
                            <span className="flex items-center gap-2">
                                <img src="/logo.svg" alt="Logo" className="h-6 sm:h-8 inline-block" /> Presentations
                            </span>
                        </div>
                        <p className="flex text-sm text-black/70 items-center cursor-pointer hover:text-blue-500 transition-colors">
                            <span className="hidden sm:inline">View all</span>
                            <ChevronRight className='h-5 w-5 sm:ml-1'/>
                        </p>
                    </div>

                    {/* Search and Sort Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {/* Search Input */}
                        <div className="relative flex-1 w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                type="text"
                                placeholder="Search presentations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-zinc-50 border-zinc-200 focus:border-blue-500 focus:ring-blue-500 w-full"
                            />
                        </div>

                        {/* Sort Dropdown - Custom Implementation */}
                        <div className="relative w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="gap-2 bg-zinc-50 border-zinc-200 hover:bg-zinc-100 w-full sm:w-auto justify-between sm:justify-start"
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    <span className="hidden sm:inline">Sort by:</span>
                                    <span className="text-base">
                                        {sortBy === 'lastEdited' && 'Last edited'}
                                        {sortBy === 'dateCreated' && 'Date created'}
                                        {sortBy === 'alphabetical' && 'Alphabetical'}
                                    </span>
                                </div>
                            </Button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <>
                                        {/* Backdrop to close dropdown */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setDropdownOpen(false)}
                                        />

                                        {/* Dropdown Menu */}
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden"
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() => {
                                                        setSortBy('lastEdited')
                                                        setDropdownOpen(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 transition-colors flex items-center justify-between ${
                                                        sortBy === 'lastEdited' ? 'bg-blue-50 text-blue-600' : 'text-zinc-700'
                                                    }`}
                                                >
                                                    <span>Last edited</span>
                                                    {sortBy === 'lastEdited' && <Check className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSortBy('dateCreated')
                                                        setDropdownOpen(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 transition-colors flex items-center justify-between ${
                                                        sortBy === 'dateCreated' ? 'bg-blue-50 text-blue-600' : 'text-zinc-700'
                                                    }`}
                                                >
                                                    <span>Date created</span>
                                                    {sortBy === 'dateCreated' && <Check className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSortBy('alphabetical')
                                                        setDropdownOpen(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 transition-colors flex items-center justify-between ${
                                                        sortBy === 'alphabetical' ? 'bg-blue-50 text-blue-600' : 'text-zinc-700'
                                                    }`}
                                                >
                                                    <span>Alphabetical</span>
                                                    {sortBy === 'alphabetical' && <Check className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </motion.div>

                {/* Grid */}
                {filteredAndSortedPresentations.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                        <Search className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-400 mx-auto mb-3" />
                        <p className="text-zinc-500 text-base sm:text-lg px-4">No presentations found matching "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 -mt-4 md:-mt-10">
                        {filteredAndSortedPresentations.map((presentation, index) => (
                            <SlideCanvas
                                key={presentation.chatId}
                                chatId={presentation.chatId}
                                version={presentation.version}
                                title={presentation.title}
                                createdAt={presentation.createdAt}
                                index={index}
                                userInfo={userInfo || null}
                                onRename={handleRename}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen} modal={true}>
                <DialogContent className="z-[10000]">
                    <DialogHeader>
                        <DialogTitle>Rename Presentation</DialogTitle>
                        <DialogDescription>
                            Enter a new name for "{renameCurrentTitle}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rename">New Name</Label>
                            <Input
                                id="rename"
                                placeholder={renameCurrentTitle}
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newTitle.trim()) {
                                        handleConfirmRename()
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmRename}
                            disabled={!newTitle.trim() || newTitle === renameCurrentTitle}
                        >
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} modal={true}>
                <DialogContent className="z-[10000]">
                    <DialogHeader>
                        <DialogTitle>Delete "{deleteTitle}"</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this presentation? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
