import { UsersTable } from "./users/data-table";
import { SessionsTable } from "./sessions/data-table";
import { DailySignupsChart } from "./daily-signups-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";

export function AdminContainer() {
    const totalUsers = useQuery(api.users.getTotalUsers);

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-row items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de admin</h1>
                <Badge variant="outline" className="p-2">
                    Total Registros: {totalUsers !== undefined ? totalUsers.toLocaleString() : "..."}
                </Badge>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                    <TabsTrigger value="analytics">Analíticas</TabsTrigger>
                    <TabsTrigger value="sessions">Sesiones</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UsersTable />
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