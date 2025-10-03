import { UsersTable } from "./users/data-table";
import { SessionsTable } from "./sessions/data-table";
import { DailySignupsChart } from "./daily-signups-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminContainer() {
    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de admin</h1>

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