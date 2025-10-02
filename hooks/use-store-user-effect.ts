import { useUser } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function useStoreUserEffect() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const { user } = useUser();
    // When this state is set we know the server
    // has stored the user.
    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const storeUser = useMutation(api.users.store);
    const updateLastLogin = useMutation(api.users.updateLastLogin);
    const userInfo = useQuery(api.users.getUserInfo);

    // Call the `storeUser` mutation function to store
    // the current user in the `users` table and return the `Id` value.
    useEffect(() => {
        // If the user is not logged in don't do anything
        if (!isAuthenticated) {
            return;
        }
        // Store the user in the database.
        // Recall that `storeUser` gets the user information via the `auth`
        // object on the server. You don't need to pass anything manually here.
        async function createUser() {
            const id = await storeUser();
            setUserId(id);
        }
        createUser();
        return () => setUserId(null);
        // Make sure the effect reruns if the user logs in with
        // a different identity
    }, [isAuthenticated, storeUser, user?.id]);

    // Check if we need to update lastLogin when day changes
    useEffect(() => {
        if (!isAuthenticated || !userInfo || !userId) {
            return;
        }

        const currentDate = new Date();
        const lastLoginDate = userInfo.lastLogin ? new Date(userInfo.lastLogin) : null;

        // Check if lastLogin exists and if the current day is different from the last login day
        if (lastLoginDate) {
            const isDifferentDay =
                currentDate.getFullYear() !== lastLoginDate.getFullYear() ||
                currentDate.getMonth() !== lastLoginDate.getMonth() ||
                currentDate.getDate() !== lastLoginDate.getDate();

            if (isDifferentDay) {
                updateLastLogin();
            }
        } else {
            // If lastLogin doesn't exist, update it
            updateLastLogin();
        }
    }, [isAuthenticated, userInfo, userId, updateLastLogin]);

    // Combine the local state with the state from context
    return {
        isLoading: isLoading || (isAuthenticated && userId === null),
        isAuthenticated: isAuthenticated && userId !== null,
    };
}