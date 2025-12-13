"use client"

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusIcon, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as fabric from 'fabric';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from "../ai-elements/loader";
import { AspectRatioType, DEFAULT_ASPECT_RATIO, getAspectRatioDimensions } from '@/lib/aspect-ratios';

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

interface TemplateCardProps {
    name: string
    description: string
    templateId: Id<"templates">
    createdAt: number
    index: number
    onRename: (templateId: Id<"templates">, currentName: string, currentDescription: string) => void
    onDelete: (templateId: Id<"templates">, name: string) => void
}

function TemplateCard({ name, description, templateId, createdAt, index, onRename, onDelete }: TemplateCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const router = useRouter()

    // Get all files for this template
    const files = useQuery(api.templates.getFilesByTemplateId, { templateId });

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
        router.push(`/templates/${templateId}`)
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
                {!firstSlide ? (
                    /* Show placeholder logo when no slide content */
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <img
                            src="/logo.png"
                            alt="Template placeholder"
                            className="w-24 h-24 object-contain opacity-40"
                        />
                    </div>
                ) : (
                    <>
                        {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Loader className="size-6 sm:size-8" />
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
                    </>
                )}
            </div>

            {/* Info Section */}
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 bg-white rounded-b-xl sm:rounded-b-2xl cursor-pointer">
                <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0 text-black pointer-events-none">
                        <h3 className="text-sm sm:text-base line-clamp-1 group-hover:text-blue-400 transition-colors font-medium">
                            {name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 line-clamp-2">
                            {description}
                        </p>
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
                                        className="absolute bottom-10 right-0 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-[999] overflow-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setMenuOpen(false)
                                                    onRename(templateId, name, description)
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 transition-colors flex items-center gap-2 text-zinc-700"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span>Rename template</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setMenuOpen(false)
                                                    onDelete(templateId, name)
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

export function AdminTemplatesContainer() {
    const templates = useQuery(api.templates.getAllAdminTemplatesWithFirstSlide);
    const deleteTemplate = useMutation(api.templates.deleteTemplate);
    const updateTemplate = useMutation(api.templates.updateTemplate);
    const createTemplateWithFiles = useMutation(api.templates.createTemplateWithFiles);
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState("");

    // Rename dialog state
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameTemplateId, setRenameTemplateId] = useState<Id<"templates"> | null>(null);
    const [renameCurrentName, setRenameCurrentName] = useState('');
    const [renameCurrentDescription, setRenameCurrentDescription] = useState('');
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');

    // Create dialog state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newTemplateDescription, setNewTemplateDescription] = useState("");
    const [selectedSourceTemplateId, setSelectedSourceTemplateId] = useState<Id<"templates"> | "none">("none");
    const [isCreating, setIsCreating] = useState(false);

    // Delete confirmation dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ name: string; id: Id<"templates"> } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredTemplates = useMemo(() => {
        const all = templates ?? [];
        const term = searchTerm.trim().toLowerCase();
        if (!term) return all;
        return all.filter((t: any) => (
            (t.name || "").toLowerCase().includes(term) ||
            (t.description || "").toLowerCase().includes(term)
        ));
    }, [templates, searchTerm]);

    // Handler to open rename dialog
    const handleRename = (templateId: Id<"templates">, currentName: string, currentDescription: string) => {
        setRenameTemplateId(templateId)
        setRenameCurrentName(currentName)
        setRenameCurrentDescription(currentDescription)
        setNewName(currentName)
        setNewDescription(currentDescription)
        setRenameDialogOpen(true)
    }

    // Handler to confirm rename
    const handleConfirmRename = async () => {
        if (renameTemplateId && (newName.trim() !== renameCurrentName || newDescription.trim() !== renameCurrentDescription)) {
            try {
                await updateTemplate({
                    id: renameTemplateId,
                    name: newName.trim() || renameCurrentName,
                    description: newDescription.trim() || renameCurrentDescription
                })
                setRenameDialogOpen(false)
            } catch (error) {
                console.error('Error renaming template:', error)
                toast.error('Error renaming template')
            }
        }
    }

    // Handler to open delete dialog
    const handleDelete = (templateId: Id<"templates">, name: string) => {
        setTemplateToDelete({ name, id: templateId })
        setIsDeleteDialogOpen(true)
    }

    const handleCreateTemplate = async () => {
        if (!newTemplateName.trim() || !newTemplateDescription.trim()) {
            toast.error("Please complete the name and description");
            return;
        }

        setIsCreating(true);
        try {
            await createTemplateWithFiles({
                name: newTemplateName.trim(),
                description: newTemplateDescription.trim(),
                sourceTemplateId: selectedSourceTemplateId !== "none" ? selectedSourceTemplateId : undefined,
            });

            toast.success("Template created successfully");
            setIsCreateDialogOpen(false);
            setNewTemplateName("");
            setNewTemplateDescription("");
            setSelectedSourceTemplateId("none");
        } catch (error) {
            console.error("Error creating template:", error);
            toast.error(error instanceof Error ? error.message : "Error creating template");
        } finally {
            setIsCreating(false);
        }
    };

    // Handler to confirm delete
    const handleConfirmDelete = async () => {
        if (!templateToDelete) return;

        setIsDeleting(true);
        try {
            await deleteTemplate({ name: templateToDelete.name });
            toast.success("Template deleted successfully");
            setIsDeleteDialogOpen(false);
            setTemplateToDelete(null);
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error(error instanceof Error ? error.message : "Error deleting template");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!templates) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-8 sm:py-12">
                    <Loader className="size-8" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-esbuild-bold)]">Templates</h1>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusIcon className="size-4" />
                    <span className="ml-2">Create New</span>
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        type="text"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-zinc-50 border-zinc-200 focus:border-blue-500 focus:ring-blue-500 w-full"
                    />
                </div>
            </div>

            {/* Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                    <Search className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-400 mx-auto mb-3" />
                    <p className="text-zinc-500 text-base sm:text-lg px-4">
                        {searchTerm ? `No templates found matching "${searchTerm}"` : 'No templates available'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredTemplates.map((template, index) => (
                        <TemplateCard
                            key={template._id}
                            name={template.name}
                            description={template.description}
                            templateId={template._id}
                            createdAt={template._creationTime}
                            index={index}
                            onRename={handleRename}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Create Template Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Template</DialogTitle>
                        <DialogDescription>
                            Create a new template. Optionally, you can copy files from an existing template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="new-template-name" className="text-sm font-medium">
                                Template Name
                            </label>
                            <Input
                                id="new-template-name"
                                placeholder="e.g., Todo App"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="new-template-description" className="text-sm font-medium">
                                Description
                            </label>
                            <Textarea
                                id="new-template-description"
                                placeholder="Describe what this template does..."
                                value={newTemplateDescription}
                                onChange={(e) => setNewTemplateDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="source-template" className="text-sm font-medium">
                                Copy files from existing template (Optional)
                            </label>
                            <Select
                                value={selectedSourceTemplateId}
                                onValueChange={(value) => setSelectedSourceTemplateId(value as Id<"templates"> | "none")}
                            >
                                <SelectTrigger id="source-template" className="w-full">
                                    <SelectValue placeholder="Select a template (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (empty template)</SelectItem>
                                    {templates?.map((template: any) => (
                                        <SelectItem key={template._id} value={template._id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedSourceTemplateId !== "none" && (
                                <p className="text-xs text-muted-foreground">
                                    Files from the selected template will be copied to the new template.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateDialogOpen(false);
                                setNewTemplateName("");
                                setNewTemplateDescription("");
                                setSelectedSourceTemplateId("none");
                            }}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTemplate}
                            disabled={isCreating || !newTemplateName.trim() || !newTemplateDescription.trim()}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="size-4" />
                                    Create Template
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen} modal={true}>
                <DialogContent className="z-[10000]">
                    <DialogHeader>
                        <DialogTitle>Rename Template</DialogTitle>
                        <DialogDescription>
                            Update the name and description for "{renameCurrentName}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rename-name">Name</Label>
                            <Input
                                id="rename-name"
                                placeholder={renameCurrentName}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="rename-description">Description</Label>
                            <Textarea
                                id="rename-description"
                                placeholder={renameCurrentDescription}
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmRename}
                            disabled={!newName.trim() || !newDescription.trim()}
                        >
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}