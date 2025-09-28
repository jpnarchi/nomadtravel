'use client'

import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { notFound, redirect } from "next/navigation";

export default function AdminPage() {
    const isAdmin = useQuery(api.users.isAdmin);
    if (!isAdmin) {
        notFound();
    }

    return (
        <div>
            <h1>Admin</h1>
        </div>
    )
}