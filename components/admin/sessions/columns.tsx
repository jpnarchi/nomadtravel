"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export type SessionWithUser = {
    _id: string
    _creationTime: number
    userId: string
    date: string
    user: {
        name: string
        email: string
        pictureUrl?: string
    } | null
}

export const columns: ColumnDef<SessionWithUser>[] = [
    {
        accessorKey: "user",
        header: "Usuario",
        cell: ({ row }) => {
            const session = row.original
            const user = session.user

            if (!user) {
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-muted-foreground">Usuario eliminado</span>
                            <span className="text-sm text-muted-foreground">ID: {session.userId}</span>
                        </div>
                    </div>
                )
            }

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
    },
    {
        accessorKey: "date",
        header: "Fecha de sesión",
        cell: ({ row }) => {
            const date = row.getValue("date") as string
            // Parse the date string as local date to avoid timezone issues
            const [year, month, day] = date.split('-').map(Number)
            const sessionDate = new Date(year, month - 1, day)
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{sessionDate.toLocaleDateString("es-ES")}</span>
                    <span className="text-sm text-muted-foreground">
                        {sessionDate.toLocaleDateString("es-ES", { weekday: "long" })}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "_creationTime",
        header: "Hora de registro",
        cell: ({ row }) => {
            const timestamp = row.getValue("_creationTime") as number
            const date = new Date(timestamp)
            return (
                <div className="text-sm text-muted-foreground">
                    {date.toLocaleString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    })}
                </div>
            )
        },
    },
    {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
            const session = row.original
            // Parse the date string as local date to avoid timezone issues
            const [year, month, day] = session.date.split('-').map(Number)
            const sessionDate = new Date(year, month - 1, day)
            const today = new Date()
            const isToday = sessionDate.toDateString() === today.toDateString()

            return (
                <Badge variant={isToday ? "default" : "secondary"}>
                    {isToday ? "Hoy" : "Pasado"}
                </Badge>
            )
        },
    },
]
