/**
 * Hook para operaciones con slides (crear, duplicar, eliminar, mover)
 */

import { useCallback } from 'react'
import { toast } from 'sonner'

interface Slide {
    id: string
    path: string
    data: any
}

interface UseSlideOperationsProps {
    slides: Slide[]
    setSlides: (slides: Slide[] | ((prev: Slide[]) => Slide[])) => void
    currentSlideIndex: number
    setCurrentSlideIndex: (index: number) => void
    setHasUnsavedChanges: (value: boolean) => void
}

export function useSlideOperations({
    slides,
    setSlides,
    currentSlideIndex,
    setCurrentSlideIndex,
    setHasUnsavedChanges
}: UseSlideOperationsProps) {
    // Add new slide
    const addSlide = useCallback(() => {
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
    }, [slides, setSlides, setCurrentSlideIndex, setHasUnsavedChanges])

    // Duplicate slide
    const duplicateSlide = useCallback((index: number) => {
        const slideToDuplicate = slides[index]
        const newSlideNumber = slides.length + 1

        const duplicatedData = {
            version: slideToDuplicate.data.version || '5.3.0',
            objects: JSON.parse(JSON.stringify(slideToDuplicate.data.objects || [])),
            background: slideToDuplicate.data.background || '#ffffff'
        }

        const newSlide = {
            id: `slide-${Date.now()}-${Math.random()}`,
            path: `/slides/slide-${newSlideNumber}.json`,
            data: duplicatedData
        }

        const updatedSlides = [
            ...slides.slice(0, index + 1),
            newSlide,
            ...slides.slice(index + 1)
        ]

        const renumberedSlides = updatedSlides.map((slide, i) => ({
            ...slide,
            path: `/slides/slide-${i + 1}.json`
        }))

        setSlides(renumberedSlides)
        setCurrentSlideIndex(index + 1)
        setHasUnsavedChanges(true)
        toast.success(`Slide ${index + 1} duplicado`)
    }, [slides, setSlides, setCurrentSlideIndex, setHasUnsavedChanges])

    // Delete slide
    const deleteSlide = useCallback((index: number) => {
        if (slides.length === 1) {
            toast.error('Debe haber al menos un slide')
            return
        }

        const updatedSlides = slides.filter((_, i) => i !== index)

        const renumberedSlides = updatedSlides.map((slide, i) => ({
            ...slide,
            path: `/slides/slide-${i + 1}.json`
        }))

        setSlides(renumberedSlides)

        if (currentSlideIndex >= renumberedSlides.length) {
            setCurrentSlideIndex(renumberedSlides.length - 1)
        }

        setHasUnsavedChanges(true)
        toast.success('Slide eliminado')
    }, [slides, currentSlideIndex, setSlides, setCurrentSlideIndex, setHasUnsavedChanges])

    // Move slide up
    const moveSlideUp = useCallback((index: number) => {
        if (index === 0) return

        setSlides(prevSlides => {
            const newSlides = prevSlides.map(slide => ({
                id: slide.id,
                path: slide.path,
                data: {
                    version: slide.data.version || '5.3.0',
                    objects: JSON.parse(JSON.stringify(slide.data.objects || [])),
                    background: slide.data.background || '#ffffff'
                }
            }))

            const temp = newSlides[index]
            newSlides[index] = newSlides[index - 1]
            newSlides[index - 1] = temp

            return newSlides.map((slide, i) => ({
                ...slide,
                path: `/slides/slide-${i + 1}.json`
            }))
        })

        if (currentSlideIndex === index) {
            setCurrentSlideIndex(index - 1)
        } else if (currentSlideIndex === index - 1) {
            setCurrentSlideIndex(index)
        }

        setHasUnsavedChanges(true)
        toast.success('Slide movido hacia arriba')
    }, [currentSlideIndex, setSlides, setCurrentSlideIndex, setHasUnsavedChanges])

    // Move slide down
    const moveSlideDown = useCallback((index: number) => {
        if (index === slides.length - 1) return

        setSlides(prevSlides => {
            const newSlides = prevSlides.map(slide => ({
                id: slide.id,
                path: slide.path,
                data: {
                    version: slide.data.version || '5.3.0',
                    objects: JSON.parse(JSON.stringify(slide.data.objects || [])),
                    background: slide.data.background || '#ffffff'
                }
            }))

            const temp = newSlides[index]
            newSlides[index] = newSlides[index + 1]
            newSlides[index + 1] = temp

            return newSlides.map((slide, i) => ({
                ...slide,
                path: `/slides/slide-${i + 1}.json`
            }))
        })

        if (currentSlideIndex === index) {
            setCurrentSlideIndex(index + 1)
        } else if (currentSlideIndex === index + 1) {
            setCurrentSlideIndex(index)
        }

        setHasUnsavedChanges(true)
        toast.success('Slide movido hacia abajo')
    }, [slides.length, currentSlideIndex, setSlides, setCurrentSlideIndex, setHasUnsavedChanges])

    return {
        addSlide,
        duplicateSlide,
        deleteSlide,
        moveSlideUp,
        moveSlideDown
    }
}
