import { DataTableDemo } from "./users/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";

export function AdminContainer() {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de admin</h1>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:w-fit sm:grid-cols-1">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Gestión de usuarios</span>
                        <span className="sm:hidden">Usuarios</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Gestión de usuarios</h2>
                            <p className="text-muted-foreground text-sm">
                                Ver y gestionar cuentas de usuario y sus planes de suscripción.
                            </p>
                        </div>
                        <DataTableDemo />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}