'use client'

/**
 * Editor de Presentaciones con Fabric.js
 *
 * Componente principal para gestionar múltiples slides de una presentación
 * Permite crear, eliminar, reordenar y editar slides
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { FabricSlideEditor } from './fabric-slide-editor'
import { Button } from '../ui/button'
import { api } from "@/convex/_generated/api";
import { ScrollArea } from '../ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DragDropOverlay } from '../global/drag-drop-overlay'
import * as fabric from 'fabric'
import { useSlideRenderer } from '@/lib/hooks/use-slide-renderer'
import { useRouter, useParams } from 'next/navigation'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Eye,
    Code,
    Save,
    Copy,
    ArrowUp,
    ArrowDown,
    FileDown,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    ArrowLeft,
    PanelLeftClose,
    PanelLeftOpen,
    Share
} from 'lucide-react'
import { toast } from 'sonner'
import { Loader } from '../ai-elements/loader'
import { useQuery, useMutation } from "convex/react";
import { exportToPDF } from '@/lib/export/pdf-exporter'
import { exportToPPT } from '@/lib/export/ppt-exporter'

interface FabricPresentationEditorProps {
    initialFiles: Record<string, string>
    onSave: (files: Record<string, string>) => void
    isSaving: boolean
    returnPath?: string // Optional path to return to when clicking "Return to Chat"
}

export function FabricPresentationEditor({
    initialFiles,
    onSave,
    isSaving,
    returnPath
}: FabricPresentationEditorProps) {
    const router = useRouter()
    const params = useParams()
    const [slides, setSlides] = useState<any[]>([])
    const isAdmin = useQuery(api.users.isAdmin);
    const userInfo = useQuery(api.users.getUserInfo);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveImage = useMutation(api.files.saveImage);
    const updateProjectDownloaded = useMutation(api.chats.updateProjectDownloaded);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [showCode, setShowCode] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
    const editorContainerRef = useRef<HTMLDivElement>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const slideEditorRef = useRef<any>(null)
    const copiedObjectRef = useRef<any>(null) // Global clipboard for all slides

    // Presentation mode canvas
    const [presentationCanvasElement, setPresentationCanvasElement] = useState<HTMLCanvasElement | null>(null)
    const presentationCanvasRef = useRef<fabric.Canvas | null>(null)
    const [presentationCanvasReady, setPresentationCanvasReady] = useState(false)

    // Load slides from initial files
    useEffect(() => {
        console.log('🟢 FabricPresentationEditor: Cargando slides desde initialFiles');
        console.log('📂 Paths encontrados:', Object.keys(initialFiles).filter(p => p.startsWith('/slides/')).sort());

        const slideFiles = Object.entries(initialFiles)
            .filter(([path]) => path.startsWith('/slides/') && path.endsWith('.json'))
            .sort((a, b) => {
                // Extract slide number from path (e.g., /slides/slide-5.json -> 5)
                const numA = parseInt(a[0].match(/slide-(\d+)\.json$/)?.[1] || '0');
                const numB = parseInt(b[0].match(/slide-(\d+)\.json$/)?.[1] || '0');
                return numA - numB; // Sort numerically instead of alphabetically
            })
            .map(([path, content], index) => {
                try {
                    const parsed = JSON.parse(content);
                    console.log(`  📄 ${path}: ${parsed.objects?.length || 0} objects`);
                    return {
                        id: `slide-${Date.now()}-${index}`, // Unique ID that persists through reorders
                        path,
                        data: parsed
                    }
                } catch (error) {
                    console.error(`Error parsing ${path}:`, error)
                    return null
                }
            })
            .filter(slide => slide !== null)

        // If no slides, create a default one
        if (slideFiles.length === 0) {
            slideFiles.push({
                id: `slide-${Date.now()}-0`,
                path: '/slides/slide-1.json',
                data: {
                    version: '5.3.0',
                    objects: [],
                    background: '#ffffff'
                }
            })
        }

        console.log(`✅ ${slideFiles.length} slides cargados en el editor`);
        setSlides(slideFiles)
        setIsLoading(false)
    }, [initialFiles])

    // Update slide data - called from FabricSlideEditor when canvas changes
    // Use useCallback to prevent unnecessary re-renders
    const updateSlide = useCallback((index: number, newData: any) => {
        console.log('🔄 updateSlide llamado:', {
            index,
            objectsCount: newData.objects?.length,
            background: newData.background
        })

        // Log each object's position
        console.log('📦 Objetos recibidos en updateSlide:')
        newData.objects?.forEach((obj: any, i: number) => {
            console.log(`  ${i}. ${obj.type} at (${obj.left}, ${obj.top}) scale(${obj.scaleX}, ${obj.scaleY})`)
        })

        setSlides(prevSlides => {
            // Bounds check to prevent errors
            if (index < 0 || index >= prevSlides.length) {
                console.log('⚠️ Index out of bounds, skipping update:', { index, slidesLength: prevSlides.length })
                return prevSlides
            }

            const updatedSlides = [...prevSlides]
            const currentData = updatedSlides[index].data

            // Only update if data actually changed
            const hasChanged =
                JSON.stringify(currentData.objects) !== JSON.stringify(newData.objects) ||
                currentData.background !== newData.background

            if (!hasChanged) {
                console.log('⏭️ No hay cambios reales, saltando actualización')
                return prevSlides
            }

            updatedSlides[index] = {
                ...updatedSlides[index],
                data: {
                    ...newData,
                    // Ensure objects array is properly cloned
                    objects: newData.objects ? [...newData.objects] : []
                }
            }

            console.log('✅ Slides actualizados:', {
                slideIndex: index,
                objectCount: updatedSlides[index].data.objects?.length,
                totalSlides: updatedSlides.length
            })

            return updatedSlides
        })

        // Mark as having unsaved changes
        setHasUnsavedChanges(true)
    }, [])

    // Add new slide
    const addSlide = () => {
        const newSlideNumber = slides.length + 1
        const newSlide = {
            id: `slide-${Date.now()}-${Math.random()}`,
            path: `/slides/slide-${newSlideNumber}.json`,
            data: {
                version: '5.3.0',
                objects: [],
                background: '#ffffff'
            }
        }

        setSlides([...slides, newSlide])
        setCurrentSlideIndex(slides.length)
        setHasUnsavedChanges(true)
        toast.success(`Slide ${newSlideNumber} creado`)
    }

    // Duplicate slide
    const duplicateSlide = (index: number) => {
        const slideToDuplicate = slides[index]
        const newSlideNumber = slides.length + 1

        // Deep clone the slide data
        const duplicatedData = {
            version: slideToDuplicate.data.version || '5.3.0',
            objects: JSON.parse(JSON.stringify(slideToDuplicate.data.objects || [])),
            background: slideToDuplicate.data.background || '#ffffff'
        }

        const newSlide = {
            id: `slide-${Date.now()}-${Math.random()}`, // New unique ID
            path: `/slides/slide-${newSlideNumber}.json`,
            data: duplicatedData
        }

        // Insert the duplicated slide right after the original
        const updatedSlides = [
            ...slides.slice(0, index + 1),
            newSlide,
            ...slides.slice(index + 1)
        ]

        // Renumber all slides
        const renumberedSlides = updatedSlides.map((slide, i) => ({
            ...slide,
            path: `/slides/slide-${i + 1}.json`
        }))

        setSlides(renumberedSlides)
        setCurrentSlideIndex(index + 1) // Move to the duplicated slide
        setHasUnsavedChanges(true)
        toast.success(`Slide ${index + 1} duplicado`)
    }

    // Delete slide
    const deleteSlide = (index: number) => {
        if (slides.length === 1) {
            toast.error('Debe haber al menos un slide')
            return
        }

        const updatedSlides = slides.filter((_, i) => i !== index)

        // Renumber slides
        const renumberedSlides = updatedSlides.map((slide, i) => ({
            ...slide,
            path: `/slides/slide-${i + 1}.json`
        }))

        setSlides(renumberedSlides)

        // Adjust current slide index
        if (currentSlideIndex >= renumberedSlides.length) {
            setCurrentSlideIndex(renumberedSlides.length - 1)
        }

        setHasUnsavedChanges(true)
        toast.success('Slide eliminado')
    }

    // Move slide up
    const moveSlideUp = (index: number) => {
        if (index === 0) return // Already at the top

        setSlides(prevSlides => {
            // Create deep copies of all slides to avoid reference sharing
            const newSlides = prevSlides.map(slide => ({
                id: slide.id, // Preserve unique ID
                path: slide.path,
                data: {
                    version: slide.data.version || '5.3.0',
                    objects: JSON.parse(JSON.stringify(slide.data.objects || [])),
                    background: slide.data.background || '#ffffff'
                }
            }))

            // Swap slides at index and index-1 using temp variable
            const temp = newSlides[index]
            newSlides[index] = newSlides[index - 1]
            newSlides[index - 1] = temp

            // Renumber paths
            return newSlides.map((slide, i) => ({
                ...slide,
                path: `/slides/slide-${i + 1}.json`
            }))
        })

        // Update current slide index to follow the moved slide
        if (currentSlideIndex === index) {
            setCurrentSlideIndex(index - 1)
        } else if (currentSlideIndex === index - 1) {
            setCurrentSlideIndex(index)
        }

        setHasUnsavedChanges(true)
        toast.success('Slide movido hacia arriba')
    }

    // Move slide down
    const moveSlideDown = (index: number) => {
        if (index === slides.length - 1) return // Already at the bottom

        setSlides(prevSlides => {
            // Create deep copies of all slides to avoid reference sharing
            const newSlides = prevSlides.map(slide => ({
                id: slide.id, // Preserve unique ID
                path: slide.path,
                data: {
                    version: slide.data.version || '5.3.0',
                    objects: JSON.parse(JSON.stringify(slide.data.objects || [])),
                    background: slide.data.background || '#ffffff'
                }
            }))

            // Swap slides at index and index+1 using temp variable
            const temp = newSlides[index]
            newSlides[index] = newSlides[index + 1]
            newSlides[index + 1] = temp

            // Renumber paths
            return newSlides.map((slide, i) => ({
                ...slide,
                path: `/slides/slide-${i + 1}.json`
            }))
        })

        // Update current slide index to follow the moved slide
        if (currentSlideIndex === index) {
            setCurrentSlideIndex(index + 1)
        } else if (currentSlideIndex === index + 1) {
            setCurrentSlideIndex(index)
        }

        setHasUnsavedChanges(true)
        toast.success('Slide movido hacia abajo')
    }

    // Check if user can export to PowerPoint
    const canExportToPPT = () => {
        if (!userInfo) return false
        // Allow admins
        if (userInfo.role === 'admin') return true
        // Allow paying users (pro, premium, ultra)
        if (userInfo.plan === 'pro' || userInfo.plan === 'premium' || userInfo.plan === 'ultra') return true
        // Block free users
        return false
    }

    // Handle PowerPoint export with authorization
    const handlePPTExport = async () => {
        if (!canExportToPPT()) {
            toast.error('PowerPoint export is only available for Pro, Premium, and Ultra users', {
                description: 'Upgrade your plan to unlock this feature'
            })
            return
        }
        exportToPPT(slides.map(slide => slide.data))

        // Mark project as downloaded
        const chatId = params?.id || params?.chatId;
        if (chatId) {
            try {
                await updateProjectDownloaded({ chatId: chatId as any, downloaded: true })
            } catch (error) {
                console.error('Error updating project download status:', error)
            }
        }
    }

    // Handle PDF export
    const handlePDFExport = async () => {
        exportToPDF(slides.map(slide => slide.data))

        // Mark project as downloaded
        const chatId = params?.id || params?.chatId;
        if (chatId) {
            try {
                await updateProjectDownloaded({ chatId: chatId as any, downloaded: true })
            } catch (error) {
                console.error('Error updating project download status:', error)
            }
        }
    }

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!fullscreenRef.current) return

        if (!document.fullscreenElement) {
            fullscreenRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true)
            }).catch((err) => {
                console.error('Error attempting to enable fullscreen:', err)
            })
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false)
            })
        }
    }

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Keyboard shortcuts for fullscreen and navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input or textarea
            const target = e.target as HTMLElement
            const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

            // Don't trigger shortcuts when typing in regular inputs or editing text
            if (isTextInput) return

            // Fullscreen toggle - only when NOT in fullscreen
            if (e.key === 'f' || e.key === 'F') {
                if (!isFullscreen) {
                    e.preventDefault()
                    toggleFullscreen()
                }
            }
            // Exit fullscreen - only when IN fullscreen
            else if (e.key === 'Escape' && isFullscreen) {
                e.preventDefault()
                document.exitFullscreen()
            }
            // Navigation with arrow keys - works in BOTH modes (editor and fullscreen)
            else if (e.key === 'ArrowRight' || (e.key === ' ' && isFullscreen)) {
                e.preventDefault()
                goToNextSlide()
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                goToPreviousSlide()
            }
            // Home/End keys - only in fullscreen mode
            else if (isFullscreen) {
                if (e.key === 'Home') {
                    e.preventDefault()
                    setCurrentSlideIndex(0)
                } else if (e.key === 'End') {
                    e.preventDefault()
                    setCurrentSlideIndex(slides.length - 1)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen, currentSlideIndex, slides.length])

    // Initialize presentation canvas when in fullscreen
    useEffect(() => {
        if (!isFullscreen) {
            // Clean up canvas when exiting fullscreen
            if (presentationCanvasRef.current) {
                console.log('🧹 Cleaning up presentation canvas (exiting fullscreen)')
                presentationCanvasRef.current.dispose()
                presentationCanvasRef.current = null
                setPresentationCanvasReady(false)
                setPresentationCanvasElement(null)
            }
            return
        }

        if (!presentationCanvasElement) {
            return
        }

        if (presentationCanvasRef.current) {
            return
        }

        console.log('🎨 Initializing presentation canvas')

        try {
            // Calculate optimal canvas size based on viewport
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            // Reserve space for controls and padding
            const availableWidth = viewportWidth * 0.9
            const availableHeight = viewportHeight * 0.75

            // Calculate scale to fit 16:9 aspect ratio
            const targetAspectRatio = 16 / 9
            let displayWidth = availableWidth
            let displayHeight = displayWidth / targetAspectRatio

            if (displayHeight > availableHeight) {
                displayHeight = availableHeight
                displayWidth = displayHeight * targetAspectRatio
            }

            const canvas = new fabric.Canvas(presentationCanvasElement, {
                width: displayWidth,
                height: displayHeight,
                backgroundColor: '#ffffff',
                selection: false,
            })

            // Set the internal resolution to 1920x1080
            const scale = displayWidth / 1920
            canvas.setZoom(scale)
            canvas.setDimensions({
                width: displayWidth,
                height: displayHeight
            })

            presentationCanvasRef.current = canvas
            setPresentationCanvasReady(true)
            console.log('✅ Presentation canvas initialized', { displayWidth, displayHeight, scale })
        } catch (error) {
            console.error('❌ Error initializing presentation canvas:', error)
        }
    }, [isFullscreen, presentationCanvasElement])

    // Handle window resize in presentation mode
    useEffect(() => {
        if (!isFullscreen || !presentationCanvasRef.current) return

        const handleResize = () => {
            if (!presentationCanvasRef.current) return

            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            const availableWidth = viewportWidth * 0.9
            const availableHeight = viewportHeight * 0.75

            const targetAspectRatio = 16 / 9
            let displayWidth = availableWidth
            let displayHeight = displayWidth / targetAspectRatio

            if (displayHeight > availableHeight) {
                displayHeight = availableHeight
                displayWidth = displayHeight * targetAspectRatio
            }

            const scale = displayWidth / 1920
            presentationCanvasRef.current.setZoom(scale)
            presentationCanvasRef.current.setDimensions({
                width: displayWidth,
                height: displayHeight
            })
            presentationCanvasRef.current.renderAll()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isFullscreen])

    // Use slide renderer for presentation mode
    useSlideRenderer(
        presentationCanvasReady,
        presentationCanvasRef,
        slides.map(slide => slide.data),
        currentSlideIndex
    )

    // Save changes
    const handleSave = () => {


        const files: Record<string, string> = {}

        slides.forEach((slide, index) => {
            console.log(`📄 Slide ${index + 1}:`, {
                path: slide.path,
                objects: slide.data.objects?.length || 0,
                background: slide.data.background
            })

            // Deep clone the slide data to ensure we capture the current state
            const slideDataToSave = {
                version: slide.data.version || '5.3.0',
                objects: slide.data.objects || [],
                background: slide.data.background || '#ffffff'
            }

            files[slide.path] = JSON.stringify(slideDataToSave, null, 2)
        })

        console.log('📦 Archivos a guardar:', Object.keys(files))
        console.log('📝 Contenido total:', Object.values(files).map(f => JSON.parse(f).objects.length))

        onSave(files)
        setHasUnsavedChanges(false)
    }

    // Navigation
    const goToPreviousSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1)
        }
    }

    const goToNextSlide = () => {
        if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1)
        }
    }

    // Handle image addition to current slide
    const handleAddImageToCurrentSlide = useCallback((imageUrl: string) => {
        // Trigger image addition to the current slide via the slide editor
        // We'll dispatch a custom event that the FabricSlideEditor will listen to
        const event = new CustomEvent('addImageToSlide', {
            detail: { imageUrl, slideIndex: currentSlideIndex }
        })
        window.dispatchEvent(event)
    }, [currentSlideIndex])

    // Handle file upload to Convex
    const handleUploadFiles = useCallback(async (files: File[]) => {
        if (files.length === 0) return

        const imageFiles = files.filter(file => file.type.startsWith('image/'))

        if (imageFiles.length === 0) {
            toast.error('Por favor arrastra archivos de imagen')
            return
        }

        setIsUploading(true)

        try {
            // Upload the first image (for now, we handle one at a time)
            const file = imageFiles[0]

            toast.info('Adding image...')

            // Generate upload URL
            const uploadUrl = await generateUploadUrl()

            // Upload file to Convex storage
            const result = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!result.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await result.json()

            // Get the public URL from Convex
            const { url } = await saveImage({ storageId })

            // Add image to current slide
            handleAddImageToCurrentSlide(url)

            toast.success('Imagen subida y agregada al slide')
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Error al subir la imagen')
        } finally {
            setIsUploading(false)
        }
    }, [generateUploadUrl, saveImage, handleAddImageToCurrentSlide])

    // Handle return to chat
    const handleReturnToChat = useCallback(() => {
        setIsBackButtonLoading(true);
        // Use provided returnPath if available, otherwise default to chat behavior
        if (returnPath) {
            router.push(returnPath);
            router.refresh();
        } else {
            const chatId = params?.id || params?.chatId;
            if (chatId) {
                router.push(`/chat/${chatId}`);
                router.refresh();
            }
        }
    }, [params, router, returnPath])

    // Global copy/paste handlers
    const handleCopyObject = useCallback((objectData: any) => {
        copiedObjectRef.current = objectData
        const count = Array.isArray(objectData) ? objectData.length : 1
        console.log(`📋 ${count} objeto(s) copiado(s) al portapapeles global:`, objectData)
        toast.success(`${count} object${count > 1 ? 's' : ''} copied`)
    }, [])

    const handlePasteObject = useCallback(() => {
        console.log('📋 Intentando pegar desde portapapeles global:', copiedObjectRef.current)
        return copiedObjectRef.current
    }, [])

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2 text-gray-900">
                    <Loader />
                    <p>Cargando editor...</p>
                </div>
            </div>
        )
    }

    const currentSlide = slides[currentSlideIndex]

    return (
        <div
            ref={fullscreenRef}
            className="fixed inset-0 w-screen h-screen flex flex-col bg-gray-100 z-50"
        >
            {isFullscreen ? (
                // Presentation Mode - Full Screen
                <div className="h-full w-full flex bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative">
                    {/* Fullscreen Exit Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="absolute top-6 right-6 h-12 w-12 text-gray-900 hover:bg-gray-300/50 bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-xl rounded-2xl border border-gray-300 shadow-xl transition-all hover:scale-105 z-50"
                    >
                        <Minimize className="size-5 text-gray-900" />
                    </Button>

                    {/* Slide Counter */}
                    <div className="absolute top-6 left-6 bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-xl rounded-2xl px-5 py-3 border border-gray-300 shadow-xl z-50">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 text-sm font-bold">{currentSlideIndex + 1}</span>
                            <span className="text-gray-500 text-sm">/</span>
                            <span className="text-gray-700 text-sm">{slides.length}</span>
                        </div>
                    </div>

                    {/* Canvas Container - Centered */}
                    <div className="flex-1 flex items-center justify-center">
                        <canvas
                            ref={(el) => {
                                if (el && !presentationCanvasElement) {
                                    console.log('📍 Presentation canvas element mounted')
                                    setPresentationCanvasElement(el)
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
                            onClick={() => setCurrentSlideIndex(0)}
                            disabled={currentSlideIndex === 0}
                            className="h-10 w-10 text-gray-900 hover:bg-gray-200/50 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                        >
                            <SkipBack className="size-5 text-gray-900" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPreviousSlide}
                            disabled={currentSlideIndex === 0}
                            className="h-11 w-11 text-gray-900 hover:bg-blue-100/50 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                        >
                            <ChevronLeft className="size-6 text-gray-900" />
                        </Button>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-200/50 rounded-xl">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlideIndex(index)}
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
                            onClick={goToNextSlide}
                            disabled={currentSlideIndex === slides.length - 1}
                            className="h-11 w-11 text-gray-900 hover:bg-blue-100/50 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                        >
                            <ChevronRight className="size-6 text-gray-900" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentSlideIndex(slides.length - 1)}
                            disabled={currentSlideIndex === slides.length - 1}
                            className="h-10 w-10 text-gray-900 hover:bg-gray-200/50 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all"
                        >
                            <SkipForward className="size-5 text-gray-900" />
                        </Button>
                    </div>
                </div>
            ) : (
                // Editor Mode - Normal View
            <div
                ref={editorContainerRef}
                className="w-full h-full flex flex-col bg-gray-100 relative overflow-hidden"
            >
            {/* Top toolbar */}
            <div
                className="bg-white border-b border-zinc-800 p-4 grid grid-cols-3 items-center"
                style={{ backgroundImage: "url('/img/background2.svg')" }}
            >
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        className="cursor-pointer text-black hover:bg-muted-500 hover:text-gray"
                        onClick={() => {
                            if (hasUnsavedChanges) {
                                setShowUnsavedChangesDialog(true);
                            } else {
                                handleReturnToChat();
                            }
                        }}
                    >
                        {isBackButtonLoading ? (<Loader />) : (<ArrowLeft className="size-4" />)}
                        {isBackButtonLoading ? "Loading" : "Return to Chat"}
                    </Button>

                    <div className="h-8 w-px bg-gray-300" />

                    <h2 className="text-xl text-black font-[family-name:var(--font-ppmori-semibold)]">Presentation Editor</h2>
                </div>

                {/* Center - Logo */}
                <div className="flex items-center justify-center">
                    <img src="/logo.png" alt="Logo" className="h-12" />
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 justify-end">
                    {/* {hasUnsavedChanges && !isSaving && (
                        <span className="text-sm text-yellow-400 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            Unsaved changes
                        </span>
                    )} */}
                    {isAdmin && (
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCode(!showCode)}
                    >
                        {showCode ? <Eye className="size-4" /> : <Code className="size-4" />}
                    </Button>)}
                    {/* Share Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                // variant="outline"
                                size="sm"
                                className=" transition-all border-1 p-6 px-4"
                            >
                                <Share className="size-4 mr-2" />
                                Share
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handlePDFExport}>
                                <FileDown className="size-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handlePPTExport}>
                                <FileDown className="size-4 mr-2" />
                                Export as PPT
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Fullscreen Button */}
                    <Button
                        size="sm"
                        onClick={toggleFullscreen}
                        className="border-1 transition-all p-6"
                    >
                         <img src="/presentation-icon.svg" alt="Present" className="size-6" />
                        {isFullscreen ? 'Exit' : 'Present'}
                    </Button>


                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={hasUnsavedChanges ? 'relative overflow-hidden bg-gradient-to-r from-[#E5332D] via-[#db3f42] to-[#BD060A] bg-[length:200%_100%] animate-gradient-x hover:shadow-lg hover:shadow-[#E5332D]/50 transition-all duration-300 p-6 border-1' : ''}
                    >
                        {isSaving ? (
                            <>
                                <Loader />
                                <span className="ml-2">Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" />
                                {hasUnsavedChanges ? 'Save Changes' : 'All Saved'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar with slide thumbnails */}
                    {!isSidebarCollapsed && (
                    <div className="w-64 bg-gray-50 border-r border-gray-300 flex flex-col transition-all duration-300">
                        <div className="p-4 border-b border-gray-300 flex-shrink-0">
                            <Button
                                className="w-full"
                                onClick={addSlide}
                            >
                                <Plus className="size-4 mr-2" />
                                New Slide
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 h-0">
                            <div className="p-4 space-y-2">
                                {slides.map((slide, index) => {
                                    const objectCount = slide.data.objects?.length || 0
                                    return (
                                        <div
                                            key={slide.id}
                                            className={`
                                                relative p-3 rounded-lg border-2 cursor-pointer transition-all
                                                ${index === currentSlideIndex
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                                }
                                            `}
                                            onClick={() => setCurrentSlideIndex(index)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    Slide {index + 1}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {/* Move up button */}
                                                    {index > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                moveSlideUp(index)
                                                            }}
                                                            title="Mover arriba"
                                                        >
                                                            <ArrowUp className="size-3" />
                                                        </Button>
                                                    )}
                                                    {/* Move down button */}
                                                    {index < slides.length - 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                moveSlideDown(index)
                                                            }}
                                                            title="Mover abajo"
                                                        >
                                                            <ArrowDown className="size-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            duplicateSlide(index)
                                                        }}
                                                        title="Duplicar"
                                                    >
                                                        <Copy className="size-3" />
                                                    </Button>
                                                    {slides.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteSlide(index)
                                                            }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className="aspect-video rounded border border-gray-300 flex items-center justify-center text-xs"
                                                style={{ backgroundColor: slide.data.background || '#ffffff' }}
                                            >
                                                <span className="font-medium text-gray-600">
                                                    {objectCount} {objectCount === 1 ? 'object' : 'objects'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                    )}

                    {/* Main editor area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {showCode ? (
                            // JSON view
                            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                                <pre className="bg-white p-4 rounded text-sm text-green-700 font-mono border border-gray-300">
                                    {JSON.stringify(currentSlide.data, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            // Visual editor
                            currentSlide && (
                                <FabricSlideEditor
                                    key={currentSlide.id}
                                    slideData={currentSlide.data}
                                    onSlideChange={(newData) => updateSlide(currentSlideIndex, newData)}
                                    slideNumber={currentSlideIndex + 1}
                                    totalSlides={slides.length}
                                    onCopyObject={handleCopyObject}
                                    onPasteObject={handlePasteObject}
                                    isSidebarCollapsed={isSidebarCollapsed}
                                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                />
                            )
                        )}
                    </div>
                </div>

                {/* Navigation controls - Always visible at bottom */}
                <div className="bg-gray-50 border-t border-gray-300 p-4 flex items-center justify-center gap-4 flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={goToPreviousSlide}
                        disabled={currentSlideIndex === 0}
                    >
                        <ChevronLeft className="size-4 mr-2" />
                        Previous
                    </Button>

                    <span className="text-gray-900 font-medium">
                        {currentSlideIndex + 1} / {slides.length}
                    </span>

                    <Button
                        variant="outline"
                        onClick={goToNextSlide}
                        disabled={currentSlideIndex === slides.length - 1}
                    >
                        Next
                        <ChevronRight className="size-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* DragDropOverlay for file uploads */}
            <DragDropOverlay onUpload={handleUploadFiles} />
            </div>
            )}

            {/* Unsaved Changes Dialog */}
            {hasUnsavedChanges && (
            <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>You have unsaved changes</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to leave? Any unsaved changes will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUnsavedChangesDialog(false)}>
                            Stay and Save
                        </Button>
                        <Button onClick={handleReturnToChat} className="bg-red-600 hover:bg-red-700">
                            Leave Without Saving
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>)}
        </div>
    )
}
