"use client"

import { api } from "@/convex/_generated/api";
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
import { ChevronDown } from "lucide-react";

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
import { TrashIcon, EditIcon, SaveIcon, CancelIcon, PreviewIcon } from "../global/icons";

export function TemplatesContainer() {
    const templates = useQuery(api.templates.getAll);
    const deleteTemplate = useMutation(api.templates.deleteTemplate);
    const updateTemplate = useMutation(api.templates.updateTemplate);
    const router = useRouter();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [searchTerm, setSearchTerm] = useState("");

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
                            onClick={() => deleteTemplate({ name: template.name })}
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
            <h1 className="text-xl sm:text-2xl font-bold mb-6">Plantillas</h1>
            <div className="flex items-center justify-between py-4">
                <Input
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="max-w-sm"
                />
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
        </div>
    );
}