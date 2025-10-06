"use client"

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

export function buildFileTree(filePaths: string[]): FileNode[] {
    const root: FileNode[] = [];

    filePaths.forEach(path => {
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

