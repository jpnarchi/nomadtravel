'use client'

import { useRef, useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageInput } from "./message-input"
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Footer } from "../global/footer";
import { UserNav } from "@/components/global/user-nav";
import { createPromptWithAttachments } from "@/lib/utils";
import { PricingPopup } from "../pricing/pricing-popup";
import { DragDropOverlay } from "../global/drag-drop-overlay";
import { ProjectsPreviewHero } from "./projects-preview-hero"
import { SuggestionButtons } from "../chat/suggestion-buttons"
import { SlideSelector } from "../chat/slides-selector"


export function ChatContainer() {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPricingPopup, setShowPricingPopup] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [templateSource, setTemplateSource] = useState<'default' | 'my-templates'>('default');
    const [selectedSlides, setSelectedSlides] = useState<number>(5);
    const allPresentations = useQuery(api.chats.getAllPresentationsWithFirstSlide)

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
            // Add number of slides to the prompt
            let prompt = `${suggestion}\nNumber of slides: ${selectedSlides}`

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

                prompt = createPromptWithAttachments(`${suggestion}\nNumber of slides: ${selectedSlides}`, fileUrls);
            }

            await updateParts({
                messageId: messageId,
                parts: [{ type: "text", text: prompt }],
            });

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
                // Add number of slides to the prompt
                let prompt = `${input}\nNumber of slides: ${selectedSlides}`

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

                    prompt = createPromptWithAttachments(`${input}\nNumber of slides: ${selectedSlides}`, fileUrls);
                }

                await updateParts({
                    messageId: messageId,
                    parts: [{ type: "text", text: prompt }],
                });

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
                className={
                        allPresentations?.length === 0
                        ? "h-screen overflow-y-auto bg-gradient-to-t from-primary from-50% to-[#F4A7B6] to-95%"
                        : "h-screen overflow-y-auto bg-background"}>


            
                {/* Hero Section - Full viewport height */}
                <div
                    className={
                        allPresentations?.length === 0
                            ? "text-white flex flex-col min-h-[calc(100dvh-4rem)] w-full relative lg:mt-10 "
                            : "text-black flex flex-col min-h-[calc(100dvh-4rem)] w-full relative "
                    }
                >
                    {allPresentations?.length === 0 ? (
                            <header className="w-full h-16 md:h-2 shrink-0 bg-transparent">
                            <div className="max-w-7xl mx-auto flex h-full items-center gap-2 px-4 justify-between">
                            <div >
                            </div>
                            <div className="flex items-center gap-12">
                                <UserNav />
                            </div>
                            </div>
                        </header>            
                    ): null}
 
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="initial-state"
                            className="flex-1 flex flex-col items-center justify-center gap-4 pb-8 px-4"
                            initial={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                y: -20,
                                transition: { duration: 0.3, ease: "easeInOut" }
                            }}
                        >
                            <motion.div
                                className=" text-3xl sm:text-4xl md:text-5xl font-inter font-bold flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center"
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
                                <p className="-mt-4 md:mt-0 text-xl sm:text-xl md:text-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center"
                                >
                                    Start by typing your idea
                                </p>
                            </motion.div>
                            <motion.div

                                className="w-full bg-transparent max-w-4xl mx-auto flex flex-col"
                                exit={{
                                    y: 20,
                                    opacity: 0,
                                    transition: { duration: 0.3, delay: 0.1, ease: "easeInOut" }
                                }}
                            >
                                <div className="flex justify-start px-6 lg:px-16 text-black">
                                    <SlideSelector
                                        onSlideChange={setSelectedSlides}
                                        userPlan={user?.plan}
                                    />
                                </div>
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
                                {allPresentations?.length === 0 ? (
                                <div className="hidden md:flex justify-center mr-2 text-black">
                                    <SuggestionButtons
                                        suggestions={suggestions}
                                        onSuggestionClick={handleSuggestionClick}
                                    />
                                </div> ) : null}
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Scroll Indicator */}
                    
                </div>

                {/* How It Works Section - Below hero, requires scroll */}
               <ProjectsPreviewHero />
                

                {/* Recent Presentations Panel - Only shown when user is signed in */}


 

                {/* Footer */}
                {/* <Footer /> */}

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

