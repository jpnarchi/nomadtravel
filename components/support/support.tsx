"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { useState } from "react";
import { CreateTicketDialog } from "./create-ticket-dialog";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/global/app-sidebar";
import { ChatHeader } from "@/components/global/chat-header";

type TicketStatus = "all" | "open" | "closed";

export function Support() {
    const [selectedTab, setSelectedTab] = useState<TicketStatus>("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const allTickets = useQuery(api.supportTickets.getAll);
    const openTickets = useQuery(api.supportTickets.getByStatus, { status: "open" });
    const closedTickets = useQuery(api.supportTickets.getByStatus, { status: "closed" });
    const counts = useQuery(api.supportTickets.getCounts);

    const updateStatus = useMutation(api.supportTickets.updateStatus);
    const deleteTicket = useMutation(api.supportTickets.deleteTicket);

    const handleStatusToggle = async (ticketId: Id<"supportTickets">, currentStatus: "open" | "closed") => {
        try {
            const newStatus = currentStatus === "open" ? "closed" : "open";
            await updateStatus({ ticketId, status: newStatus });
            toast.success(`Ticket ${newStatus === "closed" ? "closed" : "reopened"} successfully`);
        } catch (error) {
            toast.error("Failed to update ticket status");
        }
    };

    const handleDelete = async (ticketId: Id<"supportTickets">) => {
        try {
            await deleteTicket({ ticketId });
            toast.success("Ticket deleted successfully");
        } catch (error) {
            toast.error("Failed to delete ticket");
        }
    };

    const getTicketsForTab = () => {
        if (selectedTab === "open") return openTickets;
        if (selectedTab === "closed") return closedTickets;
        return allTickets;
    };

    const tickets = getTicketsForTab();
    const isLoading = tickets === undefined;

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "19rem",
                } as React.CSSProperties
            }
        >
            <AppSidebar />
            <SidebarInset className="flex flex-col h-screen">
                <ChatHeader />
                <div className="flex-1 overflow-y-auto bg-background">
                    <div className="container mx-auto p-6 max-w-6xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold font-[family-name:var(--font-esbuild-bold)]">Support Tickets</h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage your support requests and track their status
                                </p>
                            </div>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Ticket
                            </Button>
                        </div>

            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as TicketStatus)} className="w-full">
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

                <TabsContent value={selectedTab} className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : tickets && tickets.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    {selectedTab === "all" && "You haven't created any support tickets yet."}
                                    {selectedTab === "open" && "You don't have any open tickets."}
                                    {selectedTab === "closed" && "You don't have any closed tickets."}
                                </p>
                                {selectedTab === "all" && (
                                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Your First Ticket
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {tickets?.map((ticket) => (
                                <Card key={ticket._id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CardTitle className="text-xl">{ticket.title}</CardTitle>
                                                    <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                                                        {ticket.status === "open" ? (
                                                            <Clock className="w-3 h-3 mr-1" />
                                                        ) : (
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        )}
                                                        {ticket.status}
                                                    </Badge>
                                                </div>
                                                {ticket.chatTitle && (
                                                    <CardDescription className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        Related to: {ticket.chatTitle}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusToggle(ticket._id, ticket.status)}
                                                >
                                                    {ticket.status === "open" ? "Close" : "Reopen"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(ticket._id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {ticket.description}
                                        </p>
                                        {ticket.attachments && ticket.attachments.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <p className="text-sm font-medium mb-2">Attachments:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {ticket.attachments.map((attachment, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {attachment.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-4 text-xs text-muted-foreground">
                                            Created {new Date(ticket._creationTime).toLocaleDateString()} at{" "}
                                            {new Date(ticket._creationTime).toLocaleTimeString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <CreateTicketDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
