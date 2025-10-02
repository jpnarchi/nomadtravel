"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MessageSquare, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Doc } from "@/convex/_generated/dataModel"

export type Chat = Doc<"chats">

// Create a component for the actions cell to properly use hooks
function ActionsCell({ chat }: { chat: Chat }) {
    return (
        <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
                <Link href={`/chat/${chat._id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Ver Chat
                </Link>
            </Button>
        </div>
    )
}

export const columns: ColumnDef<Chat>[] = [
    {
        accessorKey: "title",
        header: "Chat",
        cell: ({ row }) => {
            const chat = row.original
            return (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {chat.title || "Chat sin título"}
                        </span>
                    </div>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            const chat = row.original
            const searchValue = value.toLowerCase()
            return (
                (chat.title || "").toLowerCase().includes(searchValue) ||
                chat._id.toLowerCase().includes(searchValue)
            )
        },
    },
    {
        accessorKey: "currentVersion",
        header: "Versión",
        cell: ({ row }) => {
            const version = row.getValue("currentVersion") as number || 1
            return (
                <Badge variant="outline">
                    v{version}
                </Badge>
            )
        },
    },
    {
        accessorKey: "isGenerating",
        header: "Estado",
        cell: ({ row }) => {
            const isGenerating = row.getValue("isGenerating") as boolean
            const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                "true": "default",
                "false": "secondary",
            }
            return (
                <Badge variant={variants[String(isGenerating)] || "secondary"}>
                    {isGenerating ? "Generando" : "Completado"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "_creationTime",
        header: "Fecha de creación",
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
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const chat = row.original
            return <ActionsCell chat={chat} />
        },
    },
]
