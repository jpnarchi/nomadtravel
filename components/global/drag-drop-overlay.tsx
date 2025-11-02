import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react"

const MAX_FILES = 5;

interface DragDropOverlayProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function DragDropOverlay({ files, setFiles }: DragDropOverlayProps) {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const filesRef = useRef(files);

    // Keep files ref up to date
    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            const remainingSlots = MAX_FILES - filesRef.current.length;

            if (remainingSlots <= 0) {
                toast.error(`Máximo ${MAX_FILES} archivos.`);
                return;
            }

            if (droppedFiles.length > remainingSlots) {
                toast.error(`Solo puedes adjuntar ${MAX_FILES} archivos.`);
            }

            const filesToAdd = droppedFiles.slice(0, remainingSlots);
            setFiles(prev => [...prev, ...filesToAdd]);
        }
    }, [setFiles]);

    useEffect(() => {
        const div = document.body;
        div.addEventListener('dragenter', handleDragEnter as any);
        div.addEventListener('dragleave', handleDragLeave as any);
        div.addEventListener('dragover', handleDragOver as any);
        div.addEventListener('drop', handleDrop as any);

        return () => {
            div.removeEventListener('dragenter', handleDragEnter as any);
            div.removeEventListener('dragleave', handleDragLeave as any);
            div.removeEventListener('dragover', handleDragOver as any);
            div.removeEventListener('drop', handleDrop as any);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    if (!isDragging) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-2xl border-4 border-dashed border-primary max-w-md text-center">
                <div className="flex justify-center mb-4">
                    <Upload className="w-28 h-28 text-[#E5332D]"/>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Drop files here</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Release to upload your files</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                    Maximum {MAX_FILES} files
                </p>
            </div>
        </div>
    );
}
