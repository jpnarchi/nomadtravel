"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { UpdatePlanDialog } from "./update-plan-dialog"

export type User = Doc<"users">

// Create a component for the actions cell to properly use hooks
function ActionsCell({ user }: { user: User }) {
    const router = useRouter()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(user._id)
            toast.success("ID copiado al portapapeles")
        } catch (error) {
            toast.error("Error al copiar el ID")
        }
    }

    const handleViewDetails = () => {
        router.push(`/user-chats/${user._id}`)
    }

    const handleOpenDialog = () => {
        setIsDialogOpen(true)
    }

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleCopyId}>
                        Copiar ID de usuario
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleViewDetails}>
                        Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenDialog}>
                        Cambiar plan
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <UpdatePlanDialog
                user={user}
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    )
}

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: "name",
        header: "Usuario",
        cell: ({ row }) => {
            const user = row.original
            const userName = user.name || user.email || "Usuario"
            const userInitial = userName.charAt(0).toUpperCase()

            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.pictureUrl} alt={userName} />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium">{userName}</span>
                        <span className="text-sm text-muted-foreground lowercase">{user.email}</span>
                    </div>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            const user = row.original
            const searchValue = value.toLowerCase()
            const userName = (user.name || user.email || "").toLowerCase()
            const userEmail = (user.email || "").toLowerCase()
            return (
                userName.includes(searchValue) ||
                userEmail.includes(searchValue)
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
                pro: "default",
                premium: "default",
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
            return <ActionsCell user={user} />
        },
    },
]
