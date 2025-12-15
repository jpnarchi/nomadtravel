/**
 * Hook para gestionar el estado de la presentación
 */

import { useState, useEffect, useCallback } from 'react'
import { AspectRatioType, DEFAULT_ASPECT_RATIO } from '@/lib/aspect-ratios'

interface Slide {
    id: string
    path: string
    data: any
}

export function usePresentationState(initialFiles: Record<string, string>) {
    const [slides, setSlides] = useState<Slide[]>([])
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
    const [aspectRatio, setAspectRatio] = useState<AspectRatioType>(DEFAULT_ASPECT_RATIO)
    const [isLoading, setIsLoading] = useState(true)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Load slides from initial files
    useEffect(() => {
        const configPath = '/presentation-config.json'
        if (initialFiles[configPath]) {
            try {
                const config = JSON.parse(initialFiles[configPath])
                if (config.aspectRatio) {
                    setAspectRatio(config.aspectRatio)
                }
            } catch (error) {
                console.error('Error parsing presentation config:', error)
            }
        }

        const slideFiles = Object.entries(initialFiles)
            .filter(([path]) => path.startsWith('/slides/') && path.endsWith('.json'))
            .sort((a, b) => {
                const numA = parseInt(a[0].match(/slide-(\d+)\.json$/)?.[1] || '0')
                const numB = parseInt(b[0].match(/slide-(\d+)\.json$/)?.[1] || '0')
                return numA - numB
            })
            .map(([path, content], index) => {
                try {
                    const parsed = JSON.parse(content)
                    return {
                        id: `slide-${Date.now()}-${index}`,
                        path,
                        data: parsed
                    }
                } catch (error) {
                    console.error(`Error parsing ${path}:`, error)
                    return null
                }
            })
            .filter(slide => slide !== null) as Slide[]

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

        setSlides(slideFiles)
        setIsLoading(false)
    }, [initialFiles])

    // Update slide data
    const updateSlide = useCallback((index: number, newData: any) => {
        setSlides(prevSlides => {
            if (index < 0 || index >= prevSlides.length) {
                return prevSlides
            }

            const updatedSlides = [...prevSlides]
            const currentData = updatedSlides[index].data

            const hasChanged =
                JSON.stringify(currentData.objects) !== JSON.stringify(newData.objects) ||
                currentData.background !== newData.background

            if (!hasChanged) {
                return prevSlides
            }

            updatedSlides[index] = {
                ...updatedSlides[index],
                data: {
                    ...newData,
                    objects: newData.objects ? [...newData.objects] : []
                }
            }

            return updatedSlides
        })

        setHasUnsavedChanges(true)
    }, [])

    return {
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
    }
}
