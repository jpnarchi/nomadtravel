"use client"

import { useState } from "react";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, FolderOpenIcon, Edit, FilePlus, FolderPlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { FileNode } from "./file-tree-utils";

interface FileTreeItemProps {
    node: FileNode;
    level: number;
    activeFile: string;
    onFileClick: (path: string) => void;
    onDeleteClick: (path: string, name: string, type: 'file' | 'folder') => void;
    onAddToFolder: (folderPath: string, type: 'file' | 'folder') => void;
    onRenameClick: (path: string, name: string, type: 'file' | 'folder') => void;
}

export function FileTreeItem({ node, level, activeFile, onFileClick, onDeleteClick, onAddToFolder, onRenameClick }: FileTreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const isActive = activeFile === node.path;

    const handleClick = (e: React.MouseEvent) => {
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
                        <div className="size-4 flex-shrink-0" />
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


