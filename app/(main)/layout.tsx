import { AuthGuard } from "@/modules/auth/components/auth-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            {children}
        </AuthGuard>
    )
}