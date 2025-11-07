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

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UploadButtonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUploadComplete?: (url: string) => void
}

export function UploadButtonDialog({ open, onOpenChange, onUploadComplete }: UploadButtonDialogProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveImage = useMutation(api.files.saveImage);

    const handleFileChange = useCallback(async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setIsUploading(true);
        toast.info('Uploading image to Convex...');

        try {
            // Generate upload URL
            const uploadUrl = await generateUploadUrl();

            // Upload file to Convex storage
            const result = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            if (!result.ok) {
                throw new Error('Failed to upload file');
            }

            const { storageId } = await result.json();

            // Get the public URL from Convex
            const { url } = await saveImage({ storageId });

            console.log("✅ Image uploaded successfully:", url);
            onUploadComplete?.(url);
            toast.success('Image uploaded and added to slide');
            onOpenChange(false);
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error('Error uploading image');
        } finally {
            setIsUploading(false);
        }
    }, [generateUploadUrl, saveImage, onUploadComplete, onOpenChange]);

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
                    <DialogTitle>Upload Image</DialogTitle>
                    <DialogDescription>
                        Select or drag an image to upload and add to the slide
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
                                <p className="text-sm text-gray-600">Uploading image...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">
                                        Click or drag an image here
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG, JPG up to 4MB
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
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};