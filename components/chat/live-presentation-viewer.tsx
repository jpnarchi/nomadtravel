'use client'

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect, useRef, useMemo } from "react";
import * as fabric from 'fabric';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { Loader } from "@/components/ai-elements/loader";
import { useRouter } from "next/navigation";

interface LivePresentationViewerProps {
    chatId: Id<"chats">;
}

export function LivePresentationViewer({ chatId }: LivePresentationViewerProps) {
    const router = useRouter();
    const currentVersion = useQuery(api.chats.getCurrentVersion, { chatId });
    const files = useQuery(api.files.getAll, { chatId, version: currentVersion || 0 });

    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [isRendered, setIsRendered] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoadingSlide, setIsLoadingSlide] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [currentSlide, setCurrentSlide] = useState<any>(null);
    const lastSlideHashRef = useRef<string>('');

    // Detectar cuando el componente está montado
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    // Extract all slides from files - MEMOIZED to prevent unnecessary re-renders
    const slides = useMemo(() => {
        if (!files) return [];

        return Object.entries(files)
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
            .filter(slide => slide !== null);
    }, [files]);

    // Update current slide only if content has actually changed
    useEffect(() => {
        const slide = slides[currentSlideIndex];
        if (!slide) {
            setCurrentSlide(null);
            lastSlideHashRef.current = '';
            return;
        }

        const slideHash = JSON.stringify(slide);

        // Only update if the content has actually changed
        if (slideHash !== lastSlideHashRef.current) {
            setCurrentSlide(slide);
            lastSlideHashRef.current = slideHash;
        }
    }, [slides, currentSlideIndex]);

    // Reset to first slide if current index is out of bounds
    useEffect(() => {
        if (currentSlideIndex >= slides.length && slides.length > 0) {
            setCurrentSlideIndex(0);
        }
    }, [slides.length, currentSlideIndex]);

    // Initialize canvas with responsive sizing
    useEffect(() => {
        if (!canvasElement || fabricCanvasRef.current || !containerRef.current) return;

        // Calculate canvas size based on container
        const containerWidth = containerRef.current.clientWidth;
        const maxWidth = Math.min(containerWidth - 64, 900);
        const aspectRatio = 16 / 9;
        const canvasWidth = maxWidth;
        const canvasHeight = canvasWidth / aspectRatio;

        const canvas = new fabric.Canvas(canvasElement, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#1a1a1a',
            selection: false,
        });

        const scale = canvasWidth / 1920;
        canvas.setZoom(scale);
        canvas.viewportTransform = [scale, 0, 0, scale, 0, 0];

        fabricCanvasRef.current = canvas;
        setIsRendered(true);

        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, [canvasElement]);

    // Render current slide
    useEffect(() => {
        if (!fabricCanvasRef.current || !isRendered || !currentSlide) return;

        const canvas = fabricCanvasRef.current;
        setIsLoadingSlide(true);

        const loadSlideObjects = async () => {
            try {
                // Pequeño delay antes de empezar a cargar
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!currentSlide.objects || !Array.isArray(currentSlide.objects)) {
                    canvas.clear();
                    canvas.backgroundColor = currentSlide.background || '#ffffff';
                    canvas.renderAll();
                    setIsLoadingSlide(false);
                    return;
                }

                const sortedObjects = [...currentSlide.objects].sort((a, b) => {
                    const aIndex = a.zIndex !== undefined ? a.zIndex : 0;
                    const bIndex = b.zIndex !== undefined ? b.zIndex : 0;
                    return aIndex - bIndex;
                });

                const objectPromises = sortedObjects.map(async (obj: any) => {
                    try {
                        const objType = (obj.type || '').toLowerCase();
                        let fabricObj: fabric.FabricObject | null = null;

                        switch (objType) {
                            case 'text':
                            case 'i-text':
                            case 'itext':
                            case 'textbox':
                                if (obj.width) {
                                    fabricObj = new fabric.Textbox(obj.text || 'Text', {
                                        left: obj.left,
                                        top: obj.top,
                                        width: obj.width,
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
                                    });
                                } else {
                                    fabricObj = new fabric.IText(obj.text || 'Text', {
                                        left: obj.left,
                                        top: obj.top,
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
                                    });
                                }
                                break;
                            case 'rect':
                            case 'rectangle':
                                fabricObj = new fabric.Rect({
                                    left: obj.left,
                                    top: obj.top,
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
                                });
                                break;
                            case 'circle':
                                fabricObj = new fabric.Circle({
                                    left: obj.left,
                                    top: obj.top,
                                    radius: obj.radius || 50,
                                    fill: obj.fill || '#000000',
                                    stroke: obj.stroke,
                                    strokeWidth: obj.strokeWidth || 0,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                });
                                break;
                            case 'triangle':
                                fabricObj = new fabric.Triangle({
                                    left: obj.left,
                                    top: obj.top,
                                    width: obj.width || 100,
                                    height: obj.height || 100,
                                    fill: obj.fill || '#000000',
                                    stroke: obj.stroke,
                                    strokeWidth: obj.strokeWidth || 0,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                });
                                break;
                            case 'line':
                                fabricObj = new fabric.Line([obj.x1 || 0, obj.y1 || 0, obj.x2 || 100, obj.y2 || 100], {
                                    stroke: obj.stroke || '#000000',
                                    strokeWidth: obj.strokeWidth || 1,
                                });
                                break;
                            case 'image':
                                if (obj.src) {
                                    try {
                                        const img = await fabric.FabricImage.fromURL(obj.src, { crossOrigin: 'anonymous' });
                                        if (obj.left !== undefined) img.set('left', obj.left);
                                        if (obj.top !== undefined) img.set('top', obj.top);
                                        if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX);
                                        if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY);
                                        if (obj.angle !== undefined) img.set('angle', obj.angle);
                                        img.set({ selectable: false, evented: false });
                                        fabricObj = img;
                                    } catch (err) {
                                        console.error('Error loading image:', err);
                                        return null;
                                    }
                                }
                                break;
                            default:
                                return null;
                        }

                        if (fabricObj) {
                            fabricObj.set({
                                selectable: false,
                                evented: false,
                            });
                            return fabricObj;
                        }
                        return null;
                    } catch (error) {
                        console.error('Error creating fabric object:', error);
                        return null;
                    }
                });

                // Esperar a que TODOS los objetos se carguen
                const loadedObjects = await Promise.all(objectPromises);
                
                // Limpiar y configurar el canvas
                canvas.clear();
                canvas.backgroundColor = currentSlide.background || '#ffffff';
                
                // Agregar todos los objetos
                loadedObjects.forEach(obj => {
                    if (obj) canvas.add(obj);
                });

                // Renderizar
                canvas.renderAll();

                // Asegurar que el renderizado se complete
                await new Promise(resolve => setTimeout(resolve, 150));

                setIsLoadingSlide(false);
            } catch (error) {
                console.error('Error loading slide:', error);
                setIsLoadingSlide(false);
            }
        };

        loadSlideObjects();
    }, [currentSlide, isRendered]);

    // Navigation handlers
    const goToPrevious = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    const goToNext = () => {
        if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlideIndex, slides.length]);

    if (!files || !currentVersion) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-background p-8 overflow-hidden">
                <div className="text-center space-y-4">
                    <Loader className="w-8 h-8 mx-auto" />
                    <p className="text-muted-foreground">Waiting for presentation...</p>
                </div>
            </div>
        );
    }

    if (slides.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-background p-8 overflow-hidden">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No slides available yet</p>
                    <p className="text-sm text-muted-foreground">Start chatting to create your presentation</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex flex-col items-center justify-center bg-background p-4 md:p-8 gap-4 md:gap-6 overflow-hidden"
        >
            {/* Header */}
            <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-base md:text-lg font-semibold">Live Preview</h3>
                    <span className="text-xs md:text-sm text-muted-foreground">
                        Version {currentVersion}
                    </span>
                    {/* MODIFICADO: Loading indicator en el header */}
                    {isLoadingSlide && isMounted && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader className="w-3 h-3" />
                            <span>Loading...</span>
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/chat/${chatId}/preview/${currentVersion}`)}
                    className="gap-2"
                >
                    <Maximize className="size-4" />
                    <span className="hidden md:inline">Full View</span>
                </Button>
            </div>

            {/* Canvas Container - SIN OVERLAY */}
            <div className="relative flex-shrink-0 max-w-full">
                <canvas
                    ref={setCanvasElement}
                    className="rounded-lg shadow-2xl border border-border max-w-full h-auto transition-opacity duration-200"
                    style={{
                        boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.3)',
                        opacity: isLoadingSlide ? 0.5 : 1, // MODIFICADO: Efecto visual simple
                    }}
                />
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={currentSlideIndex === 0 || isLoadingSlide}
                    className="gap-1 md:gap-2"
                >
                    <ChevronLeft className="size-4" />
                    <span className="hidden md:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-muted rounded-lg">
                    <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                        {currentSlideIndex + 1} / {slides.length}
                    </span>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={currentSlideIndex === slides.length - 1 || isLoadingSlide}
                    className="gap-1 md:gap-2"
                >
                    <span className="hidden md:inline">Next</span>
                    <ChevronRight className="size-4" />
                </Button>
            </div>

            {/* Slide Indicators */}
            <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto max-w-full px-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlideIndex(index)}
                        disabled={isLoadingSlide}
                        className={`
                            h-2 rounded-full transition-all duration-300 flex-shrink-0
                            ${index === currentSlideIndex
                                ? 'w-8 bg-primary'
                                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }
                            ${isLoadingSlide ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}