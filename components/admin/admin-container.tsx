import { UsersTable } from "./users/data-table";
import { DailySignupsChart } from "./daily-signups-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminContainer() {
    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de admin</h1>

            <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                    <TabsTrigger value="analytics">Analíticas</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UsersTable />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <DailySignupsChart />
                </TabsContent>
            </Tabs>
        </div>
    )
}