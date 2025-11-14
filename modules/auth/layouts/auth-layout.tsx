export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div
            className="min-h-screen min-w-screen flex flex-col h-full items-center justify-center bg-background"
            style={{
                backgroundImage: "url('/img/bg-pricing.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {children}
        </div>
    )
}