"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Doc } from "@/convex/_generated/dataModel"

export type User = Doc<"users">

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: "name",
        header: "Usuario",
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.pictureUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-muted-foreground lowercase">{user.email}</span>
                    </div>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            const user = row.original
            const searchValue = value.toLowerCase()
            return (
                user.name.toLowerCase().includes(searchValue) ||
                user.email.toLowerCase().includes(searchValue)
            )
        },
    },
    {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => {
            const plan = row.getValue("plan") as string || "free"
            const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                free: "secondary",
                basic: "default",
                pro: "default",
                admin: "destructive",
            }
            return (
                <Badge variant={variants[plan] || "secondary"} className="capitalize">
                    {plan}
                </Badge>
            )
        },
    },
    {
        accessorKey: "_creationTime",
        header: "Fecha de registro",
        cell: ({ row }) => {
            const timestamp = row.getValue("_creationTime") as number
            const date = new Date(timestamp)
            return (
                <div className="text-sm text-muted-foreground">
                    {date.toLocaleDateString("es-ES")}
                </div>
            )
        },
    },
    {
        accessorKey: "lastLogin",
        header: "Último acceso",
        cell: ({ row }) => {
            const timestamp = row.getValue("lastLogin") as number | undefined
            if (!timestamp) {
                return (
                    <div className="text-sm text-muted-foreground">
                        Nunca
                    </div>
                )
            }
            const date = new Date(timestamp)
            return (
                <div className="text-sm text-muted-foreground">
                    {date.toLocaleDateString("es-ES")}
                </div>
            )
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const user = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(user._id)}
                        >
                            Copiar ID de usuario
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                        <DropdownMenuItem>Cambiar plan</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
