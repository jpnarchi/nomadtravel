import { SignIn } from "@clerk/nextjs";
import { ParallaxScrollSecondDemo } from "../components/parallax-scroll"

export const SignInView = () => {
    return (
        <div className="h-screen w-full relative bg-gradient-to-t from-white from-50% to-[#F4A7B6] to-95%"

        >
            {/* Columna izquierda - Formulario de Sign In */}
            <div className="absolute left-0 top-0 w-full h-full md:w-1/2 flex items-center justify-center p-4 md:p-8 z-10 pt-10 lg:pt-30 md:ml-0">
                <div className="w-full max-w-md space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-semibold text-black -mb-2 ml-4">Sign in</h1>
                    <SignIn
                        routing="path"
                        path="/sign-in"
                        appearance={{
                            elements: {
                                card: "border-0 shadow-none bg-transparent outline-none !border-none",
                                rootBox: "border-0 outline-none !border-none",
                                cardBox: "border-0 shadow-none !border-none",
                                main: "border-0 !border-none",

                                header: {
                                    display: "none",
                                },
                                headerTitle: {
                                    display: "none",
                                },
                                headerSubtitle: {
                                    display: "none",
                                },
                                logoBox: {
                                    display: "none",
                                },
                                logoImage: {
                                    display: "none",
                                },
                                socialButtonsBlock: {
                                    gap: "0.5rem",
                                    overflow: "visible",
                                },
                                socialButtonsBlockButton: {
                                    backgroundColor: "#E5332D",
                                    color: "white",
                                    border: "none",
                                    justifyContent: "flex-start",
                                    paddingLeft: "1.5rem",
                                    paddingRight: "1.5rem",
                                    borderRadius: "1.2rem",
                                    marginTop: "0",
                                    height: "3rem",
                                    minHeight: "3rem",
                                    width: "100%",
                                    display: "inline-flex",
                                    overflow: "visible",
                                },
                                socialButtonsBlockButton__google: {
                                    backgroundColor: "#E5332D",
                                    "&:hover": {
                                        backgroundColor: "#D12D28",
                                    },
                                },
                                socialButtonsBlockButtonText: {
                                    color: "white",
                                    fontWeight: "500",
                                    fontSize: "1rem",
                                    whiteSpace: "nowrap",
                                    overflow: "visible",
                                    textOverflow: "clip",
                                    width: "auto",
                                    flexGrow: 1,
                                },
                                socialButtonsBlockButtonText__google: {
                                    fontSize: "1rem",
                                },
                                socialButtonsBlockButtonIcon: {
                                    filter: "brightness(0) invert(1)",
                                },
                                formFieldInput: "bg-white border border-gray-200 rounded-lg h-12",
                                formFieldLabel: {
                                    color: "#000000",
                                    fontSize: "1rem",
                                    fontWeight: "500",
                                },
                                formButtonPrimary: {
                                    backgroundColor: "#E5332D",
                                    color: "white",
                                    height: "3rem",
                                    fontSize: "1rem",
                                    fontWeight: "500",
                                    borderRadius: "1.2rem",
                                    "&:hover": {
                                        backgroundColor: "#D12D28",
                                    },
                                    "&:disabled": {
                                        backgroundColor: "white",
                                        color: "#9CA3AF",
                                        border: "1px solid #E5E7EB",
                                    },
                                },
                                footer: {
                                    backgroundColor: "white",
                                    padding: "1rem",
                                    borderRadius: "0.5rem",
                                },
                                footerAction: {
                                    backgroundColor: "white",
                                },
                                footerActionText: {
                                    color: "#000000",
                                },
                                footerActionLink: {
                                    color: "#E5332D",
                                },
                            }
                        }}
                    />
                </div>
            </div>

            {/* Columna derecha - Parallax Scroll */}
            <div className="hidden md:block absolute right-0 top-0 w-1/2 h-[150vh] overflow-visible z-0 -mr-14 -mt-8">
                <div className="w-full h-full overflow-hidden" style={{ transform: 'rotate(-10deg) scale(1.1)', transformOrigin: 'center' }}>
                    <ParallaxScrollSecondDemo className="h-full scrollbar-hide" gridClassName="-rotate-3" />
                </div>
            </div>
        </div>
    )
}