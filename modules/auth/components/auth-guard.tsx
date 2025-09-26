'use client'

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { AuthLayout } from "../layouts/auth-layout";
import { Loader } from "@/components/ai-elements/loader";
import { useStoreUserEffect } from "@/hooks/use-store-user-effect";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { isLoading, isAuthenticated } = useStoreUserEffect();
    return (
        <>
            <AuthLoading>
                <AuthLayout>
                    <Loader />
                </AuthLayout>
            </AuthLoading>
            <Authenticated>
                {isLoading && (
                    <AuthLayout>
                        <Loader />
                    </AuthLayout>
                )}
                {isAuthenticated && children}
            </Authenticated>
            <Unauthenticated>
                {children}
            </Unauthenticated>
        </>
    )
}