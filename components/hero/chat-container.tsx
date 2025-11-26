'use client'

import { useRef, useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageInput } from "./message-input"
import { useAuth } from "@clerk/nextjs";
import { CTASection } from "./cta-section"
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Footer } from "../global/footer";
import { createPromptWithAttachments } from "@/lib/utils";
import { PricingPopup } from "../pricing/pricing-popup";
import { DragDropOverlay } from "../global/drag-drop-overlay";
import { HowSection } from "./how-section"
import { ProjectsPreviewHero } from "./projects-preview-hero"
import { SuggestionButtons } from "../chat/suggestion-buttons"
import { HeroParallaxDemo } from "@/components/hero/hero-parallax-demo"

export function ChatContainer() {
    const { isSignedIn } = useAuth();
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPricingPopup, setShowPricingPopup] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [templateSource, setTemplateSource] = useState<'default' | 'my-templates'>('default');

    // Debug log for templateSource changes
    useEffect(() => {
        console.log('[Hero ChatContainer] templateSource changed to:', templateSource);
    }, [templateSource]);

    const router = useRouter();
    const user = useQuery(api.users.getUserInfo);
    const canCreateChat = useQuery(api.chats.canCreateChat);

    // Check if user can access My Templates (only ultra and admin)
    const canAccessMyTemplates = user?.role === "admin" || user?.plan === "ultra";

    const createChat = useMutation(api.chats.create);
    const createMessage = useMutation(api.messages.create);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const saveFile = useMutation(api.messages.saveFile);
    const updateParts = useMutation(api.messages.updateParts);

    const suggestions = [
        "Create a chemistry presentation",
        "Create a biology presentation",
        "Create business presentation"
    ];

    const handleSuggestionClick = async (suggestion: string) => {
        if (!isSignedIn) {
            router.push('/sign-in');
            return
        }

        // Check if user can create more chats (server-side validation)
        if (canCreateChat && !canCreateChat.canCreate) {
            setShowPricingPopup(true);
            return;
        }

        setIsLoading(true);
        try {
            const chatId = await createChat();

            // create message
            const messageId = await createMessage({
                chatId,
                role: "user",
                parts: [{ type: "text", text: '' }],
            });

            const fileUrls = [];
            let prompt = suggestion

            // check if files are present
            if (files.length > 0) {
                for (const file of files) {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });
                    const { storageId } = await result.json();

                    const { url } = await saveFile({
                        storageId,
                        messageId: messageId,
                        type: file.type,
                    });

                    fileUrls.push({ url: url, type: file.type });
                }

                prompt = createPromptWithAttachments(suggestion, fileUrls);
            }

            await updateParts({
                messageId: messageId,
                parts: [{ type: "text", text: prompt }],
            });

            localStorage.removeItem('astri-dev-draft');

            // Save templateSource to localStorage so chat page can read it
            localStorage.setItem('templateSource', templateSource);
            console.log('[Hero ChatContainer] Saved templateSource to localStorage:', templateSource);

            router.push(`/chat/${chatId}`);
        } catch (error: any) {
            console.error(error);

            // Check if it's a chat limit error
            if (error.message && error.message.includes('Chat limit exceeded')) {
                setShowPricingPopup(true);
                return;
            }

            toast.error('Error creating chat');
        } finally {
            setIsLoading(false);
        }
    };

    // Load saved draft on component mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('astri-dev-draft');
        if (savedDraft) {
            setInput(savedDraft);
        }
    }, []);

    // Save to localStorage every time input changes (only if not signed in)
    useEffect(() => {
        if (!isSignedIn) {
            localStorage.setItem('astri-dev-draft', input);
        }
    }, [input, isSignedIn]);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isSignedIn) {
            router.push('/sign-in');
            return
        }

        // Check if user can create more chats (server-side validation)
        if (canCreateChat && !canCreateChat.canCreate) {
            setShowPricingPopup(true);
            return;
        }

        setIsLoading(true);
        try {
            if (input.trim()) {
                const chatId = await createChat();

                // create message 
                const messageId = await createMessage({
                    chatId,
                    role: "user",
                    parts: [{ type: "text", text: '' }],
                });

                const fileUrls = [];
                let prompt = input

                // check if files are present 
                if (files.length > 0) {
                    for (const file of files) {
                        const postUrl = await generateUploadUrl();
                        const result = await fetch(postUrl, {
                            method: "POST",
                            headers: { "Content-Type": file.type },
                            body: file,
                        });
                        const { storageId } = await result.json();

                        const { url } = await saveFile({
                            storageId,
                            messageId: messageId,
                            type: file.type,
                        });

                        fileUrls.push({ url: url, type: file.type });
                    }

                    prompt = createPromptWithAttachments(input, fileUrls);
                }

                await updateParts({
                    messageId: messageId,
                    parts: [{ type: "text", text: prompt }],
                });

                // setFiles([]);
                // if (fileInputRef.current) {
                //     fileInputRef.current.value = '';
                // }

                localStorage.removeItem('astri-dev-draft');

                // Save templateSource to localStorage so chat page can read it
                localStorage.setItem('templateSource', templateSource);
                console.log('[Hero ChatContainer] Saved templateSource to localStorage:', templateSource);

                router.push(`/chat/${chatId}`);
            }
        } catch (error: any) {
            console.error(error);

            // Check if it's a chat limit error
            if (error.message && error.message.includes('Chat limit exceeded')) {
                setShowPricingPopup(true);
                return;
            }

            toast.error('Error creating chat');
        }
    };

    return (
        <>
            <div
                className="h-[calc(100dvh-4rem)] overflow-y-auto bg-white"

            >
                {/* Show HeroParallax only when user is NOT signed in */}
                {!isSignedIn && <HeroParallaxDemo/>}

                {/* Hero Section - Full viewport height - Only shown when user IS signed in */}
                {isSignedIn && (
                <div
                    className="flex flex-col min-h-[180vh] w-full relative"
                    style={{
                        backgroundImage: isMobile ? "url('/img/bg-phone.png')" : "url('/img/bg-pricing.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'fixed'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="initial-state"
                            className="flex-1 flex flex-col items-center justify-center gap-4 pb-8 px-4 mt-40 mb-40 lg:mb-0 lg:mt-0"
                            initial={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                y: -20,
                                transition: { duration: 0.3, ease: "easeInOut" }
                            }}
                        >
                            <motion.div
                                className="text-black text-3xl sm:text-4xl md:text-5xl font-inter font-bold flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center"
                                exit={{
                                    y: -30,
                                    opacity: 0,
                                    transition: { duration: 0.2, ease: "easeInOut" }
                                }}
                            >
                                <span>I Love</span>
                                <span className="flex items-center gap-2 sm:gap-3">
                                     <img src="/logo.svg" alt="Logo" className="h-8 sm:h-10 md:h-12 inline-block" /> Presentations
                                </span>
                            </motion.div>
                            <motion.div>
                                <p className="text-black text-xl sm:text-xl md:text-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center"
                                >
                                    Create amazing presentations <br className="sm:hidden" />by chatting with AI
                                </p>
                            </motion.div>
                            <motion.div
                                className="w-full bg-transparent max-w-4xl mx-auto flex flex-col gap-4"
                                exit={{
                                    y: 20,
                                    opacity: 0,
                                    transition: { duration: 0.3, delay: 0.1, ease: "easeInOut" }
                                }}
                            >
                                <MessageInput
                                    input={input}
                                    setInput={setInput}
                                    handleSubmit={handleSubmit}
                                    isLoading={isLoading}
                                    files={files}
                                    setFiles={setFiles}
                                    fileInputRef={fileInputRef}
                                    templateSource={canAccessMyTemplates ? templateSource : undefined}
                                    setTemplateSource={canAccessMyTemplates ? setTemplateSource : undefined}
                                    canAccessMyTemplates={canAccessMyTemplates}
                                />
                                <div className="hidden md:flex justify-center -mt-4">
                                    <SuggestionButtons
                                        suggestions={suggestions}
                                        onSuggestionClick={handleSuggestionClick}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Scroll Indicator */}
                    {!isSignedIn && ( 
                    <motion.div
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            y: [0, 10, 0]
                        }}
                        transition={{
                            opacity: { delay: 1, duration: 0.5 },
                            y: {
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                            }
                        }}
                        onClick={() => {
                            window.scrollTo({
                                top: window.innerHeight - 64,
                                behavior: 'smooth'
                            });
                        }}
                    >
                        <span className="text-black text-sm font-medium">Scroll to explore</span>
                        <svg
                            className="w-6 h-6 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </motion.div>)}

                    {/* Projects Preview - Below hero, requires scroll */}
                    <ProjectsPreviewHero />
                </div>
                )}

                {/* How It Works Section - Below hero, requires scroll */}
                
                {!isSignedIn && <HowSection />}

                {/* Recent Presentations Panel - Only shown when user is signed in */}


                {!isSignedIn && <CTASection/>}

                {/* Footer */}
                <Footer />

                {/* Drag Drop Overlay */}
                <DragDropOverlay files={files} setFiles={setFiles} />
            </div>

            <PricingPopup
                isOpen={showPricingPopup}
                onOpenChange={setShowPricingPopup}
            />
        </>
    )
}