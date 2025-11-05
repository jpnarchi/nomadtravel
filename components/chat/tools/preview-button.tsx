import { RotateCcw } from "lucide-react";
import { Card } from "../../ui/card";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import { formatCreationTime } from "@/lib/utils";
import { RestoreDialog } from "./restore-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { InspectorIcon } from "@/components/global/icons";
import * as fabric from 'fabric';

// Slide Thumbnail Component
function SlideThumbnail({ chatId, version }: { chatId: Id<"chats">, version: number }) {
    const files = useQuery(api.files.getAll, { chatId, version });
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [isRendered, setIsRendered] = useState(false);

    // Extract first slide from files
    const firstSlide = files && Object.entries(files)
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

    // Initialize canvas
    useEffect(() => {
        if (!canvasElement || !firstSlide || fabricCanvasRef.current) return;

        const canvas = new fabric.Canvas(canvasElement, {
            width: 370,  // 16:9 aspect ratio thumbnail
            height: 200,
            backgroundColor: firstSlide.background || '#1a1a1a',
            selection: false,
        });

        const scale = 364 / 1920; // Scale from full size to thumbnail
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
    }, [canvasElement, firstSlide]);

    // Render slide objects
    useEffect(() => {
        if (!fabricCanvasRef.current || !firstSlide || !isRendered) return;

        const canvas = fabricCanvasRef.current;
        canvas.clear();
        canvas.backgroundColor = firstSlide.background || '#1a1a1a';

        const loadSlideObjects = async () => {
            if (!firstSlide.objects || !Array.isArray(firstSlide.objects)) {
                canvas.renderAll();
                return;
            }

            const sortedObjects = [...firstSlide.objects].sort((a, b) => {
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

            const loadedObjects = await Promise.all(objectPromises);
            loadedObjects.forEach(obj => {
                if (obj) canvas.add(obj);
            });

            canvas.renderAll();
        };

        loadSlideObjects();
    }, [firstSlide, isRendered]);

    if (!files) {
        return (
            <div className="w-full aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
                <Loader className="w-4 h-4" />
            </div>
        );
    }

    if (!firstSlide) {
        return (
            <div className="w-full aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No slides</p>
            </div>
        );
    }

    return (
        <canvas
            ref={setCanvasElement}
            className="w-full rounded-lg shadow-md border border-border"
        />
    );
}

export function PreviewButton({
    id,
    version,
    creationTime,
    currentVersion,
}: {
    id: Id<"chats">,
    version: number,
    creationTime: string,
    currentVersion: number | null | undefined
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const router = useRouter();
    const restoreVersion = useMutation(api.messages.restoreVersion);

    // Show the SPECIFIC version that the user clicked on
    const versionToView = version;

    return (
        <div className="flex flex-col gap-2 w-full">
            <Card className="group relative w-full flex flex-col gap-4 p-4 rounded-lg border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-200">
                {/* Thumbnail Preview */}
                <div
                    className="w-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    onClick={() => {
                        setIsLoading(true);
                        router.push(`/chat/${id}/preview/${versionToView}`);
                    }}
                >
                    <SlideThumbnail chatId={id} version={version} />
                </div>

                {/* Version info and actions */}
                <div className="flex flex-row items-center justify-between gap-4 w-full">
                    {/* Version info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-foreground">Version {version}</p>
                            {version !== currentVersion && (
                                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                    Old Version
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{formatCreationTime(creationTime)}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {/* Restore button - only show if not the current version */}
                        {currentVersion !== undefined && currentVersion !== null && version !== currentVersion && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsRestoreDialogOpen(true)}
                                className="flex-shrink-0"
                                title="Restore this version"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        )}

                        <Button
                            size="sm"
                            onClick={() => {
                                setIsLoading(true);
                                router.push(`/chat/${id}/preview/${versionToView}`);
                            }}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-200 text-white cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-4 h-4" />
                                    Loading
                                </>
                            ) : (
                                <>
                                    View Presentation
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Restore Dialog */}
            <RestoreDialog
                isOpen={isRestoreDialogOpen}
                onOpenChange={setIsRestoreDialogOpen}
                version={version}
                onRestore={async () => {
                    await restoreVersion({ chatId: id, version });
                    window.location.reload();
                }}
            />
            <div className="flex flex-row items-center gap-2 text-xs text-muted-foreground italic">
                <p>Tip: Click "View Presentation" to visualize the slides.</p>
            </div>
        </div>
    )
}