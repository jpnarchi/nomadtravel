"use client"

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
    ColumnDef,
} from "@tanstack/react-table";
import { ChevronDown, Loader2, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
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
import { TrashIcon, EditIcon, SaveIcon, CancelIcon, PreviewIcon } from "../global/icons";

export function TemplatesContainer() {
    const templates = useQuery(api.templates.getAll);
    const deleteTemplate = useMutation(api.templates.deleteTemplate);
    const updateTemplate = useMutation(api.templates.updateTemplate);
    const createTemplateWithFiles = useMutation(api.templates.createTemplateWithFiles);
    const router = useRouter();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [searchTerm, setSearchTerm] = useState("");

    // Create dialog state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newTemplateDescription, setNewTemplateDescription] = useState("");
    const [selectedSourceTemplateId, setSelectedSourceTemplateId] = useState<Id<"templates"> | "none">("none");
    const [isCreating, setIsCreating] = useState(false);

    // Delete confirmation dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ name: string; id: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredTemplates = useMemo(() => {
        const all = templates ?? [];
        const term = searchTerm.trim().toLowerCase();
        if (!term) return all;
        return all.filter((t: any) => (
            (t.name || "").toLowerCase().includes(term) ||
            (t.description || "").toLowerCase().includes(term) ||
            String(t._id || "").toLowerCase().includes(term)
        ));
    }, [templates, searchTerm]);

    const handleEdit = (template: any) => {
        setEditingId(template._id);
        setEditName(template.name);
        setEditDescription(template.description);
    };

    const handleSave = async (templateId: any) => {
        if (!editName.trim() || !editDescription.trim()) return;

        try {
            await updateTemplate({
                id: templateId,
                name: editName.trim(),
                description: editDescription.trim(),
            });
            setEditingId(null);
            setEditName("");
            setEditDescription("");
        } catch (error) {
            console.error("Error updating template:", error);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditName("");
        setEditDescription("");
    };

    const handlePreview = (templateId: string) => {
        router.push(`/templates/${templateId}`);
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateName.trim() || !newTemplateDescription.trim()) {
            toast.error("Por favor completa el nombre y la descripción");
            return;
        }

        setIsCreating(true);
        try {
            await createTemplateWithFiles({
                name: newTemplateName.trim(),
                description: newTemplateDescription.trim(),
                sourceTemplateId: selectedSourceTemplateId !== "none" ? selectedSourceTemplateId : undefined,
            });

            toast.success("Plantilla creada exitosamente");
            setIsCreateDialogOpen(false);
            setNewTemplateName("");
            setNewTemplateDescription("");
            setSelectedSourceTemplateId("none");
        } catch (error) {
            console.error("Error creating template:", error);
            toast.error(error instanceof Error ? error.message : "Error al crear la plantilla");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (template: any) => {
        setTemplateToDelete({ name: template.name, id: template._id });
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!templateToDelete) return;

        setIsDeleting(true);
        try {
            await deleteTemplate({ name: templateToDelete.name });
            toast.success("Plantilla eliminada exitosamente");
            setIsDeleteDialogOpen(false);
            setTemplateToDelete(null);
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error(error instanceof Error ? error.message : "Error al eliminar la plantilla");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setTemplateToDelete(null);
    };

    type Template = any;

    function ActionsCell({ template }: { template: Template }) {
        return (
            <div className="flex items-center gap-2">
                {editingId === template._id ? (
                    <>
                        <Button size="sm" onClick={() => handleSave(template._id)}>
                            <SaveIcon />
                            <span className="ml-2">Guardar</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                            <CancelIcon />
                            <span className="ml-2">Cancelar</span>
                        </Button>
                    </>
                ) : (
                    <>
                        <Button size="sm" variant="outline" onClick={() => handlePreview(template._id)}>
                            <PreviewIcon />
                            <span className="ml-1">Vista Previa</span>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(template)}>
                            <EditIcon />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(template)}
                        >
                            <TrashIcon />
                        </Button>
                    </>
                )}
            </div>
        );
    }

    const columns: ColumnDef<Template>[] = [
        {
            accessorKey: "name",
            header: "Nombre",
            cell: ({ row }) => {
                const template = row.original as any;
                const isEditing = editingId === template._id;
                return (
                    <div className="min-w-[220px]">
                        {isEditing ? (
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre de la plantilla" />
                        ) : (
                            <span className="font-medium">{template.name}</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Descripción",
            cell: ({ row }) => {
                const template = row.original as any;
                const isEditing = editingId === template._id;
                return (
                    <div className="max-w-xl">
                        {isEditing ? (
                            <Textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Descripción de la plantilla"
                                rows={3}
                                className="resize-none"
                            />
                        ) : (
                            <span className="text-sm text-muted-foreground line-clamp-2">{template.description}</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "_creationTime",
            header: "Creado",
            cell: ({ row }) => {
                const timestamp = row.getValue("_creationTime") as number;
                const date = new Date(timestamp);
                return <div className="text-sm text-muted-foreground">{date.toLocaleDateString("es-ES")}</div>;
            },
        },
        {
            id: "actions",
            enableHiding: false,
            header: "Acciones",
            cell: ({ row }) => {
                const template = row.original as any;
                return <ActionsCell template={template} />;
            },
        },
    ];

    const table = useReactTable({
        data: filteredTemplates,
        columns,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnVisibility,
            rowSelection,
        },
        manualPagination: true,
    });

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl sm:text-2xl font-bold">Templates</h1>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusIcon className="size-4" />
                    <span className="ml-2">Crear Nueva</span>
                </Button>
            </div>
            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="max-w-md"
                    />
                </div>
                <div className="ml-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columnas <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    {(templates?.length ?? 0)} plantilla{(templates?.length ?? 0) !== 1 ? "s" : ""} en total
                </div>
            </div>

            {/* Create Template Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Plantilla</DialogTitle>
                        <DialogDescription>
                            Crea una nueva plantilla. Opcionalmente, puedes copiar los archivos de una plantilla existente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="new-template-name" className="text-sm font-medium">
                                Nombre de la Plantilla
                            </label>
                            <Input
                                id="new-template-name"
                                placeholder="Ej: Todo App"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="new-template-description" className="text-sm font-medium">
                                Descripción
                            </label>
                            <Textarea
                                id="new-template-description"
                                placeholder="Describe qué hace esta plantilla..."
                                value={newTemplateDescription}
                                onChange={(e) => setNewTemplateDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="source-template" className="text-sm font-medium">
                                Copiar archivos de plantilla existente (Opcional)
                            </label>
                            <Select
                                value={selectedSourceTemplateId}
                                onValueChange={(value) => setSelectedSourceTemplateId(value as Id<"templates"> | "none")}
                            >
                                <SelectTrigger id="source-template" className="w-full">
                                    <SelectValue placeholder="Selecciona una plantilla (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ninguna (plantilla vacía)</SelectItem>
                                    {templates?.map((template: any) => (
                                        <SelectItem key={template._id} value={template._id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedSourceTemplateId !== "none" && (
                                <p className="text-xs text-muted-foreground">
                                    Los archivos de la plantilla seleccionada serán copiados a la nueva plantilla.
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
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateTemplate}
                            disabled={isCreating || !newTemplateName.trim() || !newTemplateDescription.trim()}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="size-4" />
                                    Crear Plantilla
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Confirmar Eliminación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar la plantilla "{templateToDelete?.name}"? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelDelete}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                <>
                                    <TrashIcon />
                                    <span className="ml-2">Eliminar</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}