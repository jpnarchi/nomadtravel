import { UsersTable } from "./users/data-table";
import { SessionsTable } from "./sessions/data-table";
import { SupportTicketsTable } from "./support-tickets/data-table";
import { DailySignupsChart } from "./daily-signups-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";

export function AdminContainer() {
    const totalUsers = useQuery(api.users.getTotalUsers);
    const supportCounts = useQuery(api.supportTickets.getCountsAsAdmin);

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-row items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-esbuild-bold)]">Admin Panel</h1>
                <div className="flex gap-2">
                    <Badge variant="outline" className="p-2">
                        Total Users: {totalUsers !== undefined ? totalUsers.toLocaleString() : "..."}
                    </Badge>
                    <Badge variant="outline" className="p-2">
                        Support Tickets: {supportCounts !== undefined ? supportCounts.all.toLocaleString() : "..."}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="support">Support</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UsersTable />
                </TabsContent>

                <TabsContent value="support">
                    <SupportTicketsTable />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <DailySignupsChart />
                </TabsContent>

                <TabsContent value="sessions">
                    <SessionsTable />
                </TabsContent>
            </Tabs>
        </div>
    )
}