import { Id } from "@/convex/_generated/dataModel";
import { UserChats } from "@/components/user-chats/user-chats";

export default async function UserChatsPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    return (
        <UserChats
            userId={userId as Id<"users">}
        />
    );
}
