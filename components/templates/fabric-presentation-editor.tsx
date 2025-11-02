'use client'

/**
 * Editor de Presentaciones con Fabric.js
 *
 * Componente principal para gestionar múltiples slides de una presentación
 * Permite crear, eliminar, reordenar y editar slides
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { FabricSlideEditor } from './fabric-slide-editor'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
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
    ArrowDown
} from 'lucide-react'
import { toast } from 'sonner'
import { Loader } from '../ai-elements/loader'

interface FabricPresentationEditorProps {
    initialFiles: Record<string, string>
    onSave: (files: Record<string, string>) => void
    isSaving: boolean
}

export function FabricPresentationEditor({
    initialFiles,
    onSave,
    isSaving
}: FabricPresentationEditorProps) {
    const [slides, setSlides] = useState<any[]>([])
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [showCode, setShowCode] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
                    console.log(`  📄 ${path}: ${parsed.objects?.length || 0} objetos`);
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

        setSlides(prevSlides => {
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

    // Save changes
    const handleSave = () => {
        console.log('💾 Guardando presentación...')
        console.log('📊 Estado actual de slides:', slides.map((s, i) => ({
            index: i,
            path: s.path,
            objectCount: s.data.objects?.length || 0,
            background: s.data.background
        })))

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

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-2 text-white">
                    <Loader />
                    <p>Cargando editor...</p>
                </div>
            </div>
        )
    }

    const currentSlide = slides[currentSlideIndex]

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Top toolbar */}
            <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Editor de Presentación</h2>
                    <span className="text-sm text-zinc-400">
                        Slide {currentSlideIndex + 1} de {slides.length}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateSlide(currentSlideIndex)}
                    >
                        <Copy className="size-4 mr-2" />
                        Duplicar Slide
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && !isSaving && (
                        <span className="text-sm text-yellow-400 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            Cambios sin guardar
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCode(!showCode)}
                    >
                        {showCode ? <Eye className="size-4 mr-2" /> : <Code className="size-4 mr-2" />}
                        {showCode ? 'Editor' : 'Ver JSON'}
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                        {isSaving ? (
                            <>
                                <Loader />
                                <span className="ml-2">Guardando...</span>
                            </>
                        ) : (
                            <>
                                <Save className="size-4 mr-2" />
                                {hasUnsavedChanges ? 'Guardar Cambios' : 'Todo Guardado'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar with slide thumbnails */}
                    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                        <div className="p-4 border-b border-zinc-800 flex-shrink-0">
                            <Button
                                className="w-full"
                                onClick={addSlide}
                            >
                                <Plus className="size-4 mr-2" />
                                Nuevo Slide
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
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                                                }
                                            `}
                                            onClick={() => setCurrentSlideIndex(index)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-white">
                                                    Slide {index + 1}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {/* Move up button */}
                                                    {index > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
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
                                                            className="h-6 w-6 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
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
                                                        className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
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
                                                            className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteSlide(index)
                                                            }}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className="aspect-video rounded border border-zinc-700 flex items-center justify-center text-xs"
                                                style={{ backgroundColor: slide.data.background || '#ffffff' }}
                                            >
                                                <span className="font-medium text-zinc-700">
                                                    {objectCount} {objectCount === 1 ? 'objeto' : 'objetos'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Main editor area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {showCode ? (
                            // JSON view
                            <div className="flex-1 overflow-auto p-6 bg-zinc-900">
                                <pre className="bg-black p-4 rounded text-sm text-green-400 font-mono">
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
                                />
                            )
                        )}
                    </div>
                </div>

                {/* Navigation controls - Always visible at bottom */}
                <div className="bg-zinc-900 border-t border-zinc-800 p-4 flex items-center justify-center gap-4 flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={goToPreviousSlide}
                        disabled={currentSlideIndex === 0}
                    >
                        <ChevronLeft className="size-4 mr-2" />
                        Anterior
                    </Button>

                    <span className="text-white font-medium">
                        {currentSlideIndex + 1} / {slides.length}
                    </span>

                    <Button
                        variant="outline"
                        onClick={goToNextSlide}
                        disabled={currentSlideIndex === slides.length - 1}
                    >
                        Siguiente
                        <ChevronRight className="size-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
