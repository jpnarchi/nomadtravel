import { UsersTable } from "./users/data-table";

export function AdminContainer() {
    return (
        <div className="p-4 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de admin</h1>
            <UsersTable />
        </div>
    )
}