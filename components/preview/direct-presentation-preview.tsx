'use client'

/**
 * Visualizador de Presentaciones estilo PowerPoint
 *
 * Características:
 * - Navegación directa entre slides (sin fragmentos/efectos internos)
 * - Al hacer click en las flechas se va directamente al siguiente slide completo
 * - Diseño limpio y moderno con controles estilo PowerPoint
 * - Transiciones rápidas y directas
 * - Formato 16:9 optimizado (1280x720)
 */

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Loader } from '../ai-elements/loader'
import Head from 'next/head'

interface DirectPresentationPreviewProps {
    chatId: Id<"chats">
    version: number
    theme: string
    transition: string
}

export function DirectPresentationPreview({
    chatId,
    version,
    theme,
    transition,
}: DirectPresentationPreviewProps) {
    const files = useQuery(api.files.getAll, { chatId, version })
    const [isRevealReady, setIsRevealReady] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const revealInitialized = useRef(false)
    const [slideHTML, setSlideHTML] = useState('')

    // Process files and generate slide HTML
    useEffect(() => {
        if (!files) return

        const slideFiles = Object.entries(files)
            .filter(([path]) => path.startsWith('/slides/'))
            .sort((a, b) => a[0].localeCompare(b[0]))

        let html = ''

        slideFiles.forEach(([path, content]) => {
            // Extract the JSX content from the return statement
            const returnMatch = content.match(/return\s*\(([\s\S]*?)\);?\s*\}/)
            if (returnMatch) {
                let jsxContent = returnMatch[1].trim()

                // Basic JSX to HTML conversion
                jsxContent = jsxContent
                    .replace(/className=/g, 'class=')
                    .replace(/\{`/g, '')
                    .replace(/`\}/g, '')
                    .replace(/\{'/g, "'")
                    .replace(/'\}/g, "'")

                html += jsxContent + '\n'
            }
        })

        setSlideHTML(html)
    }, [files])

    // Load Reveal.js dynamically
    useEffect(() => {
        if (typeof window === 'undefined') return

        const loadReveal = async () => {
            // Load CSS
            if (!document.getElementById('reveal-css')) {
                const revealCSS = document.createElement('link')
                revealCSS.id = 'reveal-css'
                revealCSS.rel = 'stylesheet'
                revealCSS.href = 'https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.css'
                document.head.appendChild(revealCSS)
            }

            if (!document.getElementById('reveal-theme-css')) {
                const themeCSS = document.createElement('link')
                themeCSS.id = 'reveal-theme-css'
                themeCSS.rel = 'stylesheet'
                themeCSS.href = `https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/${theme}.css`
                document.head.appendChild(themeCSS)
            }

            if (!document.getElementById('highlight-css')) {
                const highlightCSS = document.createElement('link')
                highlightCSS.id = 'highlight-css'
                highlightCSS.rel = 'stylesheet'
                highlightCSS.href = 'https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/highlight/monokai.css'
                document.head.appendChild(highlightCSS)
            }

            // Load TailwindCSS
            if (!document.getElementById('tailwind-css')) {
                const tailwindScript = document.createElement('script')
                tailwindScript.id = 'tailwind-css'
                tailwindScript.src = 'https://cdn.tailwindcss.com'
                document.head.appendChild(tailwindScript)
            }

            // Add PowerPoint-style custom CSS
            if (!document.getElementById('powerpoint-css')) {
                const customCSS = document.createElement('style')
                customCSS.id = 'powerpoint-css'
                customCSS.innerHTML = `
                    /* PowerPoint-style controls */
                    .reveal .controls {
                        bottom: 20px;
                        right: 20px;
                    }

                    .reveal .controls button {
                        width: 40px;
                        height: 40px;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border-radius: 8px;
                        transition: all 0.2s ease;
                    }

                    .reveal .controls button:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: scale(1.1);
                    }

                    /* Progress bar style */
                    .reveal .progress {
                        height: 4px;
                        background: rgba(255, 255, 255, 0.1);
                    }

                    .reveal .progress span {
                        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    }

                    /* Slide number style */
                    .reveal .slide-number {
                        background: rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(10px);
                        padding: 8px 12px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        color: white;
                        bottom: 20px;
                        right: 20px;
                    }

                    /* Slide transitions - instant like PowerPoint */
                    .reveal .slides section {
                        transition: none !important;
                    }

                    /* Remove fragment animations */
                    .reveal .slides section .fragment {
                        opacity: 1 !important;
                        visibility: visible !important;
                        transform: none !important;
                    }

                    /* Better slide background */
                    .reveal-viewport {
                        background: #1a1a1a;
                    }

                    /* Slide shadow for depth */
                    .reveal .slides {
                        box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
                    }
                `
                document.head.appendChild(customCSS)
            }

            // Load Reveal.js
            if (!window.Reveal) {
                const revealScript = document.createElement('script')
                revealScript.src = 'https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.js'
                revealScript.onload = () => setIsRevealReady(true)
                document.body.appendChild(revealScript)
            } else {
                setIsRevealReady(true)
            }
        }

        loadReveal()
    }, [theme])

    // Initialize Reveal.js
    useEffect(() => {
        if (!isRevealReady || !slideHTML || revealInitialized.current) return

        const initReveal = async () => {
            if (window.Reveal && !revealInitialized.current) {
                try {
                    await window.Reveal.initialize({
                        controls: true,
                        progress: true,
                        center: true,
                        hash: true,
                        transition: transition as any,
                        transitionSpeed: 'fast',
                        slideNumber: 'c/t',
                        keyboard: true,
                        overview: true,
                        touch: true,
                        loop: false,
                        fragments: false, // Deshabilitar fragmentos para navegación directa
                        autoAnimate: false, // Deshabilitar animaciones automáticas
                        autoAnimateEasing: 'ease',
                        autoAnimateDuration: 0.3,
                        width: 1280, // Tamaño más grande estilo PowerPoint
                        height: 720,
                        margin: 0.02, // Menos margen para más espacio
                        minScale: 0.2,
                        maxScale: 2.0,
                        embedded: false,
                        controlsLayout: 'bottom-right', // Controles estilo PowerPoint
                        controlsBackArrows: 'visible',
                        navigationMode: 'linear', // Navegación lineal sin fragmentos
                    })
                    revealInitialized.current = true
                    console.log('Reveal.js initialized successfully')
                } catch (error) {
                    console.error('Error initializing Reveal.js:', error)
                }
            }
        }

        setTimeout(initReveal, 500)
    }, [isRevealReady, slideHTML, transition])

    // Handle theme changes
    useEffect(() => {
        if (!isRevealReady) return

        const themeLink = document.getElementById('reveal-theme-css') as HTMLLinkElement
        if (themeLink) {
            themeLink.href = `https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/${theme}.css`
        }
    }, [theme, isRevealReady])

    // Handle transition changes
    useEffect(() => {
        if (!isRevealReady || !revealInitialized.current) return

        if (window.Reveal) {
            try {
                window.Reveal.configure({ transition: transition as any })
            } catch (error) {
                console.error('Error changing transition:', error)
            }
        }
    }, [transition, isRevealReady])

    // Sync slides when HTML changes
    useEffect(() => {
        if (!revealInitialized.current || !window.Reveal) return

        setTimeout(() => {
            window.Reveal.sync()
        }, 100)
    }, [slideHTML])

    // Listen for control messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { type } = event.data

            if (type === 'EXPORT_PDF') {
                window.print()
            } else if (type === 'TOGGLE_FULLSCREEN') {
                if (document.fullscreenElement) {
                    document.exitFullscreen()
                } else {
                    containerRef.current?.requestFullscreen()
                }
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    if (!files) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-2 text-white">
                    <Loader />
                    <p>Cargando presentación...</p>
                </div>
            </div>
        )
    }

    const presentationFile = files['/Presentation.js']

    if (!presentationFile) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <div className="text-white text-center p-8">
                    <p className="text-xl mb-4">No se encontró la presentación</p>
                    <p className="text-sm text-gray-400">Asegúrate de que la IA haya generado los archivos de la presentación</p>
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="reveal h-full w-full">
            <div
                className="slides"
                dangerouslySetInnerHTML={{ __html: slideHTML }}
            />
        </div>
    )
}

// Global type declaration for Reveal
declare global {
    interface Window {
        Reveal: any
    }
}
