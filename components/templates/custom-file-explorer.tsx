"use client"

import { useSandpack } from "@codesandbox/sandpack-react";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, FolderOpenIcon, Plus, Trash2, FilePlus, FolderPlus, SaveIcon, Edit } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

function buildFileTree(filePaths: string[]): FileNode[] {
    const root: FileNode[] = [];

    filePaths.forEach(path => {
        // Remove leading slash if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        const parts = cleanPath.split('/');

        let currentLevel = root;
        let currentPath = '';

        parts.forEach((part, index) => {
            currentPath += (currentPath ? '/' : '') + part;
            const fullPath = '/' + currentPath;
            const isFile = index === parts.length - 1;

            let existingNode = currentLevel.find(node => node.name === part);

            if (!existingNode) {
                existingNode = {
                    name: part,
                    path: fullPath,
                    type: isFile ? 'file' : 'folder',
                    children: isFile ? undefined : []
                };
                currentLevel.push(existingNode);
            }

            if (!isFile && existingNode.children) {
                currentLevel = existingNode.children;
            }
        });
    });

    // Sort: folders first, then files, both alphabetically
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        }).map(node => ({
            ...node,
            children: node.children ? sortNodes(node.children) : undefined
        }));
    };

    return sortNodes(root);
}

interface FileTreeItemProps {
    node: FileNode;
    level: number;
    activeFile: string;
    onFileClick: (path: string) => void;
    onDeleteClick: (path: string, name: string, type: 'file' | 'folder') => void;
    onAddToFolder: (folderPath: string, type: 'file' | 'folder') => void;
    onRenameClick: (path: string, name: string, type: 'file' | 'folder') => void;
}

function FileTreeItem({ node, level, activeFile, onFileClick, onDeleteClick, onAddToFolder, onRenameClick }: FileTreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const isActive = activeFile === node.path;

    const handleClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on delete button
        if ((e.target as HTMLElement).closest('[data-delete-button]')) {
            return;
        }

        if (node.type === 'folder') {
            setIsExpanded(!isExpanded);
        } else {
            onFileClick(node.path);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteClick(node.path, node.name, node.type);
    };

    const paddingLeft = level * 12 + 8;

    const itemContent = (
        <>
            <div
                className={cn(
                    "group flex items-center gap-1 py-1.5 px-2 cursor-pointer hover:bg-accent/50 transition-colors text-sm relative",
                    isActive && "bg-accent text-accent-foreground"
                )}
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {node.type === 'folder' ? (
                    <>
                        {isExpanded ? (
                            <ChevronDown className="size-4 flex-shrink-0 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="size-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        {isExpanded ? (
                            <FolderOpenIcon className="size-4 flex-shrink-0 text-green-500" />
                        ) : (
                            <FolderIcon className="size-4 flex-shrink-0 text-green-500" />
                        )}
                    </>
                ) : (
                    <>
                        <div className="size-4 flex-shrink-0" /> {/* Spacer for alignment */}
                        <FileIcon className="size-4 flex-shrink-0 text-gray-500" />
                    </>
                )}
                <span className="truncate flex-1 text-foreground/90">
                    {node.name}
                </span>
                {isHovered && (
                    <button
                        data-delete-button
                        onClick={handleDelete}
                        className="p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all"
                        title="Delete"
                    >
                        <Trash2 className="size-3.5 text-destructive" />
                    </button>
                )}
            </div>
            {node.type === 'folder' && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeItem
                            key={child.path}
                            node={child}
                            level={level + 1}
                            activeFile={activeFile}
                            onFileClick={onFileClick}
                            onDeleteClick={onDeleteClick}
                            onAddToFolder={onAddToFolder}
                            onRenameClick={onRenameClick}
                        />
                    ))}
                </div>
            )}
        </>
    );

    // Wrap both files and folders with context menu
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div>{itemContent}</div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                {node.type === 'folder' && (
                    <>
                        <ContextMenuItem onClick={() => onAddToFolder(node.path, 'file')}>
                            <FilePlus className="mr-2 h-4 w-4" />
                            Nuevo Archivo
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onAddToFolder(node.path, 'folder')}>
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Nueva Carpeta
                        </ContextMenuItem>
                    </>
                )}
                <ContextMenuItem onClick={() => onRenameClick(node.path, node.name, node.type)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Renombrar
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}

interface CustomFileExplorerProps {
    templateId: Id<"templates">;
    initialFiles: Record<string, string>;
    onFilesChange: (files: Record<string, string>) => void;
    onSave: (files: Record<string, string>) => Promise<void>;
    hasChanges: boolean;
    isSaving: boolean;
}

export function CustomFileExplorer({
    templateId,
    initialFiles,
    onFilesChange,
    onSave,
    hasChanges,
    isSaving
}: CustomFileExplorerProps) {
    const { sandpack } = useSandpack();
    const { files, activeFile, openFile, deleteFile, addFile } = sandpack;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'file' | 'folder'>('file');
    const [newItemName, setNewItemName] = useState('');
    const [targetFolder, setTargetFolder] = useState<string>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ path: string; name: string; type: 'file' | 'folder' } | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [itemToRename, setItemToRename] = useState<{ path: string; name: string; type: 'file' | 'folder' } | null>(null);
    const [newName, setNewName] = useState('');

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
        onFilesChange(currentFiles);
    }, [files, onFilesChange]);

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
        setNewItemName('');
        setIsDialogOpen(true);
    };

    const handleAddToFolder = (folderPath: string, type: 'file' | 'folder') => {
        handleAddNew(type, folderPath);
    };

    const handleCreateItem = async () => {
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
        setNewItemName('');
        setTargetFolder('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreateItem();
        }
    };

    const handleRenameClick = (path: string, name: string, type: 'file' | 'folder') => {
        setItemToRename({ path, name, type });
        setNewName(name);
        setRenameDialogOpen(true);
    };

    const handleConfirmRename = async () => {
        if (!itemToRename || !newName.trim() || newName === itemToRename.name) {
            setRenameDialogOpen(false);
            return;
        }

        try {
            // Calculate new path
            const pathParts = itemToRename.path.split('/');
            pathParts[pathParts.length - 1] = newName;
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
                    toast.error(`Ya existe una carpeta con el nombre: ${newName}`);
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
        setNewName('');
    };

    const handleSaveClick = async () => {
        const currentFiles: Record<string, string> = {};
        Object.entries(files).forEach(([path, file]) => {
            if (typeof file === 'string') {
                currentFiles[path] = file;
            } else if (file && typeof file === 'object' && 'code' in file) {
                currentFiles[path] = file.code;
            }
        });
        await onSave(currentFiles);
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
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="mr-1 h-4 w-4" />
                                    Guardar Cambios
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

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renombrar {itemToRename?.type === 'folder' ? 'Carpeta' : 'Archivo'}</DialogTitle>
                        <DialogDescription>
                            Ingresa el nuevo nombre para {itemToRename?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rename">Nuevo Nombre</Label>
                            <Input
                                id="rename"
                                placeholder={itemToRename?.name}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleConfirmRename();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmRename} disabled={!newName.trim() || newName === itemToRename?.name}>
                            Renombrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Crear Nuevo {dialogType === 'file' ? 'Archivo' : 'Carpeta'}
                            {targetFolder && ` en ${targetFolder}`}
                        </DialogTitle>
                        <DialogDescription>
                            {targetFolder
                                ? `Ingresa el nombre del ${dialogType === 'file' ? 'archivo' : 'carpeta'} (ej., Button.tsx o utils)`
                                : `Ingresa la ruta del ${dialogType === 'file' ? 'archivo' : 'carpeta'}. Usa / para rutas anidadas (ej., /components/Button.tsx)`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Nombre del {dialogType === 'file' ? 'Archivo' : 'Carpeta'}
                            </Label>
                            {targetFolder && (
                                <p className="text-sm text-muted-foreground">
                                    Ubicación: {targetFolder}/
                                </p>
                            )}
                            <Input
                                id="name"
                                placeholder={
                                    targetFolder
                                        ? (dialogType === 'file' ? 'Button.tsx' : 'components')
                                        : (dialogType === 'file' ? '/MyComponent.tsx' : '/components')
                                }
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateItem} disabled={!newItemName.trim()}>
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar {itemToDelete?.name}</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar este {itemToDelete?.type === 'folder' ? 'carpeta y todos sus archivos' : 'archivo'}?
                            Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}