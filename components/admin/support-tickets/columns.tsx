"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Trash2, CheckCircle2, Clock, User, Download } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"

function AttachmentItem({ attachment }: { attachment: { storageId: string; name: string; type: string; size: number } }) {
    const url = useQuery(api.supportTickets.getAttachmentUrl, { storageId: attachment.storageId })

    const handleDownload = () => {
        if (url) {
            window.open(url, '_blank')
        } else {
            toast.error("Unable to download file")
        }
    }

    return (
        <div className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <div className="flex gap-2 items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(2)} KB
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                            {attachment.type}
                        </p>
                    </div>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!url}
            >
                <Download className="w-4 h-4" />
            </Button>
        </div>
    )
}

type SupportTicket = {
    _id: Id<"supportTickets">
    _creationTime: number
    userId: Id<"users">
    chatId?: Id<"chats">
    title: string
    description: string
    status: "open" | "closed"
    attachments?: Array<{
        storageId: string
        name: string
        type: string
        size: number
    }>
    userName: string
    userEmail: string
    chatTitle: string | null
}

function ActionCell({ ticket }: { ticket: SupportTicket }) {
    const [showDetails, setShowDetails] = useState(false)
    const router = useRouter()
    const updateStatus = useMutation(api.supportTickets.updateStatusAsAdmin)
    const deleteTicket = useMutation(api.supportTickets.deleteTicketAsAdmin)

    const handleViewUserDetails = () => {
        router.push(`/user-chats/${ticket.userId}`)
    }

    const handleStatusToggle = async () => {
        try {
            const newStatus = ticket.status === "open" ? "closed" : "open"
            await updateStatus({ ticketId: ticket._id, status: newStatus })
            toast.success(`Ticket ${newStatus === "closed" ? "closed" : "reopened"}`)
        } catch (error) {
            toast.error("Failed to update ticket status")
        }
    }

    const handleDelete = async () => {
        try {
            await deleteTicket({ ticketId: ticket._id })
            toast.success("Ticket deleted successfully")
        } catch (error) {
            toast.error("Failed to delete ticket")
        }
    }


    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setShowDetails(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Ticket Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewUserDetails}>
                        <User className="mr-2 h-4 w-4" />
                        View User Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleStatusToggle}>
                        {ticket.status === "open" ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Closed
                            </>
                        ) : (
                            <>
                                <Clock className="mr-2 h-4 w-4" />
                                Reopen Ticket
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{ticket.title}</DialogTitle>
                        <DialogDescription>
                            Ticket details and information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">User</p>
                            <p className="text-sm text-muted-foreground">{ticket.userName} ({ticket.userEmail})</p>
                        </div>
                        {ticket.chatTitle && (
                            <div>
                                <p className="text-sm font-medium">Related Chat</p>
                                <p className="text-sm text-muted-foreground">{ticket.chatTitle}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium">Status</p>
                            <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                                {ticket.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                        </div>
                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Attachments ({ticket.attachments.length})</p>
                                <div className="space-y-2">
                                    {ticket.attachments.map((attachment, index) => (
                                        <AttachmentItem key={index} attachment={attachment} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium">Created</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(ticket._creationTime).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export const columns: ColumnDef<SupportTicket>[] = [
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue("title")}</div>
        },
    },
    {
        accessorKey: "userName",
        header: "User",
        cell: ({ row }) => {
            const userName = row.getValue("userName") as string
            const userEmail = row.original.userEmail
            return (
                <div>
                    <div className="font-medium">{userName}</div>
                    <div className="text-xs text-muted-foreground">{userEmail}</div>
                </div>
            )
        },
    },
    {
        accessorKey: "chatTitle",
        header: "Related Chat",
        cell: ({ row }) => {
            const chatTitle = row.getValue("chatTitle") as string | null
            return chatTitle ? (
                <div className="text-sm">{chatTitle}</div>
            ) : (
                <div className="text-sm text-muted-foreground">-</div>
            )
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as "open" | "closed"
            return (
                <Badge variant={status === "open" ? "default" : "secondary"}>
                    {status === "open" ? (
                        <Clock className="w-3 h-3 mr-1" />
                    ) : (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "_creationTime",
        header: "Created",
        cell: ({ row }) => {
            const creationTime = row.getValue("_creationTime") as number
            return (
                <div className="text-sm">
                    {new Date(creationTime).toLocaleDateString()}
                </div>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return <ActionCell ticket={row.original} />
        },
    },
]
