"use client"

import { useSandpack } from "@codesandbox/sandpack-react";
import { Plus, SaveIcon, FilePlus, FolderPlus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { buildFileTree } from "./file-tree-utils";
import { FileTreeItem } from "./file-tree-item";
import { CreateItemDialog } from "./create-item-dialog";
import { RenameDialog } from "./rename-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface WorkbenchFileExplorerProps {
    chatId: Id<"chats">;
    version: number;
    initialFiles: Record<string, string>;
}

export function WorkbenchFileExplorer({
    chatId,
    version,
    initialFiles,
}: WorkbenchFileExplorerProps) {
    const { sandpack } = useSandpack();
    const { files, activeFile, openFile, deleteFile, addFile } = sandpack;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'file' | 'folder'>('file');
    const [targetFolder, setTargetFolder] = useState<string>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ path: string; name: string; type: 'file' | 'folder' } | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [itemToRename, setItemToRename] = useState<{ path: string; name: string; type: 'file' | 'folder' } | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Convex mutations
    const createFile = useMutation(api.files.create);
    const deleteFileByPath = useMutation(api.files.deleteByPath);
    const updateFileByPath = useMutation(api.files.updateByPath);
    const deleteFilesInVersion = useMutation(api.files.deleteFilesInVersion);
    const createBatch = useMutation(api.files.createBatch);

    // Track file changes
    useEffect(() => {
        const currentFiles: Record<string, string> = {};
        Object.entries(files).forEach(([path, file]) => {
            if (typeof file === 'string') {
                currentFiles[path] = file;
            } else if (file && typeof file === 'object' && 'code' in file) {
                currentFiles[path] = file.code;
            }
        });

        // Compare current files with initial files
        const currentKeys = Object.keys(currentFiles).sort();
        const initialKeys = Object.keys(initialFiles).sort();

        const hasStructuralChanges = JSON.stringify(currentKeys) !== JSON.stringify(initialKeys);
        const hasContentChanges = currentKeys.some(key => currentFiles[key] !== initialFiles[key]);

        setHasChanges(hasStructuralChanges || hasContentChanges);
    }, [files, initialFiles]);

    const fileTree = useMemo(() => {
        const filePaths = Object.keys(files);
        return buildFileTree(filePaths);
    }, [files]);

    const handleFileClick = (path: string) => {
        openFile(path);
    };

    const handleDeleteClick = (path: string, name: string, type: 'file' | 'folder') => {
        setItemToDelete({ path, name, type });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'folder') {
                // Get all files that need to be deleted (for folders)
                const filesToDelete = Object.keys(files).filter(filePath =>
                    filePath === itemToDelete.path || filePath.startsWith(itemToDelete.path + '/')
                );

                // Delete from Sandpack (database will be updated when user clicks Save)
                for (const filePath of filesToDelete) {
                    deleteFile(filePath);
                }

                toast.success(`Carpeta eliminada exitosamente (${filesToDelete.length} archivo(s))`);
            } else {
                // Delete single file
                deleteFile(itemToDelete.path);
                toast.success('Archivo eliminado exitosamente');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar. Por favor, inténtalo de nuevo.');
        }

        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const handleAddNew = (type: 'file' | 'folder', folderPath: string = '') => {
        setDialogType(type);
        setTargetFolder(folderPath);
        setIsDialogOpen(true);
    };

    const handleAddToFolder = (folderPath: string, type: 'file' | 'folder') => {
        handleAddNew(type, folderPath);
    };

    const handleCreateItem = async (newItemName: string) => {
        if (!newItemName.trim()) return;

        let fullPath: string;

        if (targetFolder) {
            // Creating inside a specific folder
            const cleanName = newItemName.startsWith('/') ? newItemName.slice(1) : newItemName;
            fullPath = `${targetFolder}/${cleanName}`;
        } else {
            // Creating at root
            fullPath = newItemName.startsWith('/') ? newItemName : `/${newItemName}`;
        }

        // Check if file or folder already exists (case-insensitive)
        const existingPaths = Object.keys(files);
        const pathExists = existingPaths.some(existingPath =>
            existingPath.toLowerCase() === fullPath.toLowerCase()
        );

        if (pathExists) {
            toast.error(`Ya existe un archivo o carpeta con la ruta: ${fullPath}`);
            return;
        }

        // For folders, check if any files exist that would be inside this folder (case-insensitive)
        if (dialogType === 'folder') {
            const folderPath = fullPath.endsWith('/') ? fullPath : `${fullPath}/`;
            const conflictingFiles = existingPaths.filter(filePath =>
                filePath.toLowerCase().startsWith(folderPath.toLowerCase())
            );

            if (conflictingFiles.length > 0) {
                toast.error(`Ya existe una carpeta con el nombre: ${newItemName}`);
                return;
            }
        }

        try {
            if (dialogType === 'file') {
                // Add file with empty content (database will be updated when user clicks Save)
                addFile(fullPath, '');
                openFile(fullPath);

                toast.success(`Archivo creado en ${fullPath}`);
            } else {
                // For folders, create an index.js file to make the folder visible in Sandpack
                // Sandpack requires at least one file to show a folder
                const indexPath = `${fullPath}/index.js`;
                const indexContent = '// Nueva carpeta\n';
                addFile(indexPath, indexContent);
                openFile(indexPath);

                toast.success(`Carpeta creada en ${fullPath}`);
            }
        } catch (error) {
            console.error('Error creating file:', error);
            toast.error('Error al crear archivo. Por favor, inténtalo de nuevo.');
        }

        setIsDialogOpen(false);
        setTargetFolder('');
    };

    const handleRenameClick = (path: string, name: string, type: 'file' | 'folder') => {
        setItemToRename({ path, name, type });
        setRenameDialogOpen(true);
    };

    const handleConfirmRename = async (confirmedNewName: string) => {
        if (!itemToRename || !confirmedNewName.trim() || confirmedNewName === itemToRename.name) {
            setRenameDialogOpen(false);
            return;
        }

        try {
            // Calculate new path
            const pathParts = itemToRename.path.split('/');
            pathParts[pathParts.length - 1] = confirmedNewName;
            const newPath = pathParts.join('/');

            // Check if the new path already exists (case-insensitive, but not if it's the same as current path)
            const existingPaths = Object.keys(files);
            const pathExists = existingPaths.some(existingPath =>
                existingPath.toLowerCase() === newPath.toLowerCase() && existingPath !== itemToRename.path
            );

            if (pathExists) {
                toast.error(`Ya existe un archivo o carpeta con la ruta: ${newPath}`);
                return;
            }

            // For folders, check if any files exist that would be inside the new folder path (case-insensitive)
            if (itemToRename.type === 'folder') {
                const newFolderPath = newPath.endsWith('/') ? newPath : `${newPath}/`;
                const conflictingFiles = existingPaths.filter(filePath =>
                    filePath.toLowerCase().startsWith(newFolderPath.toLowerCase()) &&
                    !filePath.toLowerCase().startsWith(itemToRename.path.toLowerCase() + '/') &&
                    filePath.toLowerCase() !== itemToRename.path.toLowerCase()
                );

                if (conflictingFiles.length > 0) {
                    toast.error(`Ya existe una carpeta con el nombre: ${confirmedNewName}`);
                    return;
                }
            }

            // Get all files that need to be renamed (for folders)
            const filesToRename = Object.keys(files).filter(filePath =>
                filePath === itemToRename.path || filePath.startsWith(itemToRename.path + '/')
            );

            // For folders, also check if any of the new paths would conflict
            if (itemToRename.type === 'folder') {
                for (const oldPath of filesToRename) {
                    const updatedPath = oldPath === itemToRename.path
                        ? newPath
                        : oldPath.replace(itemToRename.path, newPath);

                    if (files[updatedPath] && updatedPath !== oldPath) {
                        toast.error(`No se puede renombrar: ya existe un archivo con la ruta ${updatedPath}`);
                        return;
                    }
                }
            }

            // Rename in sandpack (database will be updated when user clicks Save)
            for (const oldPath of filesToRename) {
                const fileContent = typeof files[oldPath] === 'string'
                    ? files[oldPath]
                    : (files[oldPath] as any).code;

                const updatedPath = oldPath === itemToRename.path
                    ? newPath
                    : oldPath.replace(itemToRename.path, newPath);

                addFile(updatedPath, fileContent);
                deleteFile(oldPath);
            }

            toast.success(`${itemToRename.type === 'folder' ? 'Carpeta' : 'Archivo'} renombrado exitosamente`);
        } catch (error) {
            console.error('Error renaming:', error);
            toast.error('Error al renombrar. Por favor, inténtalo de nuevo.');
        }

        setRenameDialogOpen(false);
        setItemToRename(null);
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        try {
            // Get current files from sandpack
            const currentFiles: Record<string, string> = {};
            Object.entries(files).forEach(([path, file]) => {
                if (typeof file === 'string') {
                    currentFiles[path] = file;
                } else if (file && typeof file === 'object' && 'code' in file) {
                    currentFiles[path] = file.code;
                }
            });

            // Create files array for batch operations
            const filesToCreate = Object.entries(currentFiles).map(([path, content]) => ({
                path,
                content,
            }));

            // Delete all files in current version
            await deleteFilesInVersion({ chatId, version });

            // Delete all files in next version (version + 1)
            await deleteFilesInVersion({ chatId, version: version + 1 });

            // Create new files in batch for current version
            await createBatch({
                chatId,
                files: filesToCreate,
                version,
            });

            // Create new files in batch for next version (version + 1)
            await createBatch({
                chatId,
                files: filesToCreate,
                version: version + 1,
            });

            toast.success('Cambios guardados!');
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving files:', error);
            toast.error('Error al guardar los cambios');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div
                className="bg-[#151515] border-r border-border overflow-y-auto flex flex-col"
                style={{
                    width: '250px',
                    height: '100%',
                    minWidth: '250px',
                    maxWidth: '250px'
                }}
            >
                <div className="sticky top-0 bg-[#151515] border-b border-border px-3 py-2 flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground/80">Archivos</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddNew('file')}>
                                <FilePlus className="mr-2 h-4 w-4" />
                                Nuevo Archivo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddNew('folder')}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Nueva Carpeta
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {hasChanges && (
                    <div className="px-2 py-2 border-b border-border bg-accent/30">
                        <Button
                            onClick={handleSaveClick}
                            disabled={isSaving}
                            size="sm"
                            className="w-full"
                        >
                            {isSaving ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="mr-1 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                )}
                <div className="py-1 flex-1 overflow-y-auto">
                    {fileTree.map((node) => (
                        <FileTreeItem
                            key={node.path}
                            node={node}
                            level={0}
                            activeFile={activeFile}
                            onFileClick={handleFileClick}
                            onDeleteClick={handleDeleteClick}
                            onAddToFolder={handleAddToFolder}
                            onRenameClick={handleRenameClick}
                        />
                    ))}
                </div>
            </div>

            <RenameDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
                itemName={itemToRename?.name}
                itemType={itemToRename?.type}
                onConfirm={(name) => handleConfirmRename(name)}
            />

            <CreateItemDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                dialogType={dialogType}
                targetFolder={targetFolder}
                onConfirm={(name) => handleCreateItem(name)}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                itemName={itemToDelete?.name}
                itemType={itemToDelete?.type}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}

