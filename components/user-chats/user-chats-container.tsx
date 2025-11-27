"use client"

import { Id } from "@/convex/_generated/dataModel"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ChatsTable } from "./data-table"

interface UserChatsContainerProps {
    userId: Id<"users">
}

export function UserChatsContainer({ userId }: UserChatsContainerProps) {
    const user = useQuery(api.users.getUserByIdAsAdmin, { userId })

    return (
        <div className="p-4 space-y-2">
            <div className="flex flex-col gap-3">
                <Link href="/admin">
                    <div className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Return to admin
                    </div>
                </Link>
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold font-[family-name:var(--font-esbuild-bold)]">Chats</h1>
                    {user ? (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Name:</span>
                                <span>{user.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Email:</span>
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Plan:</span>
                                <span className="capitalize">{user.plan}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <span className="text-muted-foreground">Loading user information...</span>
                        </div>
                    )}
                </div>
            </div>

            <ChatsTable userId={userId} />
        </div>
    )
}
