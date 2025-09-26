'use client'

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardPage() {
    const users = useQuery(api.users.getMany);
    const add = useMutation(api.users.add);
    
    return (
        <div>
            <h1>Dashboard</h1>
            {users?.map((user) => (
                <div key={user._id}>{user.name}</div>
            ))}
            <button onClick={() => {
                add({ name: "John Doe" });
            }}>Add User</button>
        </div>
    )
}