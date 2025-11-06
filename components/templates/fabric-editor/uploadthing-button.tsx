import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button }  from "@/components/ui/button"
import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'

import {
    generateUploadButton,
    generateUploadDropzone,
    generateReactHelpers,
  } from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

const { useUploadThing } = generateReactHelpers<OurFileRouter>({
    url: "/api/uploadthing",
});

interface UploadButtonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUploadComplete?: (url: string) => void
}

export function UploadButtonDialog({ open, onOpenChange, onUploadComplete }: UploadButtonDialogProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen');
            return;
        }

        setIsUploading(true);
        toast.info('Procesando imagen...');

        try {
            // Read the file as a data URL
            const reader = new FileReader();

            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;

                if (imageUrl) {
                    console.log("Image loaded successfully");
                    onUploadComplete?.(imageUrl);
                    toast.success('Imagen agregada al slide');
                    onOpenChange(false);
                } else {
                    toast.error('No se pudo cargar la imagen');
                }

                setIsUploading(false);
            };

            reader.onerror = () => {
                console.error("Error reading file");
                toast.error('Error al leer el archivo');
                setIsUploading(false);
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error processing file:", error);
            toast.error('Error al procesar la imagen');
            setIsUploading(false);
        }
    }, [onUploadComplete, onOpenChange]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFileChange(files);
    }, [handleFileChange]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Subir Imagen</DialogTitle>
                    <DialogDescription>
                        Selecciona o arrastra una imagen para subirla y agregarla al slide
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`
                            relative border-2 border-dashed rounded-lg p-8
                            flex flex-col items-center justify-center gap-4
                            cursor-pointer transition-colors
                            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                <p className="text-sm text-gray-600">Subiendo imagen...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">
                                        Haz clic o arrastra una imagen aquí
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG, JPG hasta 4MB
                                    </p>
                                </div>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                handleFileChange(files);
                            }}
                            disabled={isUploading}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isUploading}
                    >
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};