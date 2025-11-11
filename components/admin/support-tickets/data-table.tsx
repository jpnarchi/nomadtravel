"use client"

import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
    getFilteredRowModel,
    ColumnFiltersState,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { columns } from "./columns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TicketStatus = "all" | "open" | "closed"

export function SupportTicketsTable() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [selectedTab, setSelectedTab] = React.useState<TicketStatus>("all")

    const allTickets = useQuery(api.supportTickets.getAllAsAdmin, {})
    const counts = useQuery(api.supportTickets.getCountsAsAdmin)

    // Filter tickets based on selected tab
    const filteredTickets = React.useMemo(() => {
        if (!allTickets) return []
        if (selectedTab === "all") return allTickets
        return allTickets.filter(ticket => ticket.status === selectedTab)
    }, [allTickets, selectedTab])

    const table = useReactTable({
        data: filteredTickets ?? [],
        columns,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnVisibility,
            columnFilters,
        },
    })

    const isLoading = allTickets === undefined

    return (
        <div className="w-full space-y-4">
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as TicketStatus)}>
                <TabsList>
                    <TabsTrigger value="all">
                        All ({counts?.all ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="open">
                        Open ({counts?.open ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="closed">
                        Closed ({counts?.closed ?? 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Input
                            placeholder="Search by title or user..."
                            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("title")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    Columns <ChevronDown />
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
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            Loading tickets...
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No support tickets found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            {filteredTickets?.length ?? 0} ticket{filteredTickets?.length !== 1 ? "s" : ""} loaded
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
