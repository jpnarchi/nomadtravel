import { DataTableDemo } from "./users/data-table";
import { SystemPrompts } from "./prompts/system-prompts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, MessageSquare } from "lucide-react";

export function AdminContainer() {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Panel</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Manage system settings, users, and AI prompts from the admin dashboard.
                </p>
            </div>

            <Tabs defaultValue="prompts" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:w-fit sm:grid-cols-2">
                    <TabsTrigger value="prompts" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">System Prompts</span>
                        <span className="sm:hidden">Prompts</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">User Management</span>
                        <span className="sm:hidden">Users</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="prompts" className="mt-6">
                    <SystemPrompts />
                </TabsContent>

                <TabsContent value="users" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">User Management</h2>
                            <p className="text-muted-foreground text-sm">
                                View and manage user accounts and their subscription plans.
                            </p>
                        </div>
                        <DataTableDemo />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}