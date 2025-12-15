'use client'

/**
 * Editor de Presentaciones con Fabric.js - REFACTORIZADO
 *
 * Componente principal para gestionar múltiples slides de una presentación
 * Ahora usa hooks personalizados y componentes modulares
 */

import { useState, useCallback, useRef } from 'react'
import { FabricSlideEditor } from './fabric-slide-editor'
import { Button } from '../ui/button'
import { api } from "@/convex/_generated/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DragDropOverlay } from '../global/drag-drop-overlay'
import { useSlideRenderer } from '@/lib/hooks/use-slide-renderer'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Loader } from '../ai-elements/loader'
import { useQuery, useMutation } from "convex/react"
import { AspectRatioType } from '@/lib/aspect-ratios'

// Hooks personalizados
import { usePresentationState } from './hooks/use-presentation-state'
import { useSlideOperations } from './hooks/use-slide-operations'
import { usePresentationMode } from './hooks/use-presentation-mode'
import { useExportHandlers } from './hooks/use-export-handlers'

// Componentes
import { PresentationToolbar } from './presentation/presentation-toolbar'
import { SlidesSidebar } from './presentation/slides-sidebar'
import { PresentationModeView } from './presentation/presentation-mode-view'

interface FabricPresentationEditorProps {
    initialFiles: Record<string, string>
    onSave: (files: Record<string, string>) => void
    isSaving: boolean
    returnPath?: string
}

export function FabricPresentationEditor({
    initialFiles,
    onSave,
    isSaving,
    returnPath
}: FabricPresentationEditorProps) {
    const router = useRouter()
    const params = useParams()

    // Convex queries
    const isAdmin = useQuery(api.users.isAdmin)
    const userInfo = useQuery(api.users.getUserInfo)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const saveImage = useMutation(api.files.saveImage)

    // Local state
    const [showCode, setShowCode] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
    const [editableCode, setEditableCode] = useState('')
    const [codeError, setCodeError] = useState<string | null>(null)

    const copiedObjectRef = useRef<any>(null)

    // Custom hooks
    const {
        slides,
        setSlides,
        currentSlideIndex,
        setCurrentSlideIndex,
        aspectRatio,
        setAspectRatio,
        isLoading,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        updateSlide
    } = usePresentationState(initialFiles)

    const {
        addSlide,
        duplicateSlide,
        deleteSlide,
        moveSlideUp,
        moveSlideDown
    } = useSlideOperations({
        slides,
        setSlides,
        currentSlideIndex,
        setCurrentSlideIndex,
        setHasUnsavedChanges
    })

    const {
        isFullscreen,
        fullscreenRef,
        toggleFullscreen,
        presentationCanvasElement,
        setPresentationCanvasElement,
        presentationCanvasRef,
        presentationCanvasReady,
        goToPreviousSlide,
        goToNextSlide
    } = usePresentationMode({
        aspectRatio,
        slides,
        currentSlideIndex,
        setCurrentSlideIndex
    })

    const { handlePDFExport, handlePPTExport } = useExportHandlers({
        slides,
        aspectRatio,
        userInfo
    })

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

        const presentationConfig = {
            aspectRatio: aspectRatio,
            version: '1.0'
        }
        files['/presentation-config.json'] = JSON.stringify(presentationConfig, null, 2)

        slides.forEach((slide) => {
            const slideDataToSave = {
                version: slide.data.version || '5.3.0',
                objects: slide.data.objects || [],
                background: slide.data.background || '#ffffff'
            }
            files[slide.path] = JSON.stringify(slideDataToSave, null, 2)
        })

        onSave(files)
        setHasUnsavedChanges(false)
    }

    // Handle image addition to current slide
    const handleAddImageToCurrentSlide = useCallback((imageUrl: string) => {
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
            const file = imageFiles[0]
            toast.info('Adding image...')

            const uploadUrl = await generateUploadUrl()

            const result = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!result.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await result.json()
            const { url } = await saveImage({ storageId })

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
        setIsBackButtonLoading(true)
        if (returnPath) {
            router.push(returnPath)
            router.refresh()
        } else {
            const chatId = params?.id || params?.chatId
            if (chatId) {
                router.push(`/chat/${chatId}`)
                router.refresh()
            }
        }
    }, [params, router, returnPath])

    // Global copy/paste handlers
    const handleCopyObject = useCallback((objectData: any) => {
        copiedObjectRef.current = objectData
        const count = Array.isArray(objectData) ? objectData.length : 1
        toast.success(`${count} object${count > 1 ? 's' : ''} copied`)
    }, [])

    const handlePasteObject = useCallback(() => {
        return copiedObjectRef.current
    }, [])

    // Apply code changes
    const handleApplyCodeChanges = useCallback(() => {
        try {
            const parsedData = JSON.parse(editableCode)

            if (!parsedData.objects || !Array.isArray(parsedData.objects)) {
                throw new Error('Invalid JSON structure: missing or invalid "objects" array')
            }

            updateSlide(currentSlideIndex, parsedData)
            setCodeError(null)
            toast.success('Code changes applied successfully')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Invalid JSON'
            setCodeError(errorMessage)
            toast.error('Failed to apply changes: ' + errorMessage)
        }
    }, [editableCode, currentSlideIndex, updateSlide])

    // Handle aspect ratio change
    const handleAspectRatioChange = (newRatio: AspectRatioType) => {
        setAspectRatio(newRatio)
        setHasUnsavedChanges(true)
        toast.success(`Aspect ratio changed to ${newRatio}`)
    }

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
                <PresentationModeView
                    currentSlideIndex={currentSlideIndex}
                    totalSlides={slides.length}
                    canvasElement={presentationCanvasElement}
                    onCanvasMount={setPresentationCanvasElement}
                    onToggleFullscreen={toggleFullscreen}
                    onGoToSlide={setCurrentSlideIndex}
                    onPreviousSlide={goToPreviousSlide}
                    onNextSlide={goToNextSlide}
                />
            ) : (
                <div className="w-full h-full flex flex-col bg-gray-100 relative overflow-hidden">
                    <PresentationToolbar
                        isBackButtonLoading={isBackButtonLoading}
                        hasUnsavedChanges={hasUnsavedChanges}
                        isSaving={isSaving}
                        isAdmin={!!isAdmin}
                        showCode={showCode}
                        aspectRatio={aspectRatio}
                        isFullscreen={isFullscreen}
                        onReturnToChat={() => {
                            if (hasUnsavedChanges) {
                                setShowUnsavedChangesDialog(true)
                            } else {
                                handleReturnToChat()
                            }
                        }}
                        onToggleCode={() => setShowCode(!showCode)}
                        onAspectRatioChange={handleAspectRatioChange}
                        onPDFExport={handlePDFExport}
                        onPPTExport={handlePPTExport}
                        onToggleFullscreen={toggleFullscreen}
                        onSave={handleSave}
                    />

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 flex overflow-hidden">
                            {!isSidebarCollapsed && (
                                <SlidesSidebar
                                    slides={slides}
                                    currentSlideIndex={currentSlideIndex}
                                    onSlideClick={setCurrentSlideIndex}
                                    onAddSlide={addSlide}
                                    onDuplicateSlide={duplicateSlide}
                                    onDeleteSlide={deleteSlide}
                                    onMoveSlideUp={moveSlideUp}
                                    onMoveSlideDown={moveSlideDown}
                                />
                            )}

                            <div className="flex-1 flex flex-col overflow-hidden">
                                {showCode ? (
                                    <div className="flex-1 flex flex-col overflow-hidden p-6 bg-gray-50 gap-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Edit Slide {currentSlideIndex + 1} JSON
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditableCode(JSON.stringify(currentSlide.data, null, 2))
                                                        setCodeError(null)
                                                        toast.success('Changes reset')
                                                    }}
                                                >
                                                    Reset
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleApplyCodeChanges}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Apply Changes
                                                </Button>
                                            </div>
                                        </div>

                                        {codeError && (
                                            <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 text-sm">
                                                <strong>Error:</strong> {codeError}
                                            </div>
                                        )}

                                        <textarea
                                            value={editableCode}
                                            onChange={(e) => setEditableCode(e.target.value)}
                                            className="flex-1 bg-white p-4 rounded-lg text-sm text-gray-900 font-mono border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : (
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
                                            aspectRatio={aspectRatio}
                                        />
                                    )
                                )}
                            </div>
                        </div>

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

                    <DragDropOverlay onUpload={handleUploadFiles} />
                </div>
            )}

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
                </Dialog>
            )}
        </div>
    )
}
