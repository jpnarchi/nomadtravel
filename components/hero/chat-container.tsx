'use client'

import { useRef, useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageInput } from "./message-input"
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { createPromptWithAttachments } from "@/lib/utils";
import { PricingPopup } from "../pricing/pricing-popup";
// import { DragDropOverlay } from "../global/drag-drop-overlay";
import { ProjectsPreviewHero } from "./projects-preview-hero"
import { SlideSelector } from "../chat/slides-selector"
import { Footer } from "../global/footer"


export function ChatContainer() {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPricingPopup, setShowPricingPopup] = useState(false);
    const [templateSource, setTemplateSource] = useState<'default' | 'my-templates'>('default');
    const [selectedSlides, setSelectedSlides] = useState<number>(5);

    // Debug log for templateSource changes
    useEffect(() => {
        console.log('[Hero ChatContainer] templateSource changed to:', templateSource);
    }, [templateSource]);

    // Handler for slide changes
    const handleSlideChange = (numSlides: number) => {
        setSelectedSlides(numSlides);
    };

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

                // Save templateSource to localStorage so chat page can read it
                localStorage.setItem('templateSource', templateSource);
                console.log('[Hero ChatContainer] Saved templateSource to localStorage:', templateSource);

                // Save slides count to localStorage so chat page can read it
                localStorage.setItem('slidesCount', selectedSlides.toString());
                console.log('[Hero ChatContainer] Saved slidesCount to localStorage:', selectedSlides);

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
            <div className="h-screen overflow-y-auto overflow-x-hidden bg-white">
                {/* Hero Section - Full viewport height */}

                <div className="text-black flex flex-col min-h-[calc(100dvh-4rem)] w-full relative bg-gradient-to-t from-[#F4A7B6]/30  from-10% to-primary to-99%">
                {/* <img
                        src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIujywkLOXp1zcDUfrCqNGaIx5LkJ9gbPMjRn6"
                        alt="Decorative left"
                        className="hidden lg:block absolute left-0 bottom-0 w-32  -ml-20 xl:w-60 h-auto opacity-20 mb-40 pointer-events-none z-0 drop-shadow-[0_0_25px_rgba(255,255,255,0.9)]"
                    /> */}
                                    {/* Imagen derecha - Solo visible en desktop */}
                {/* <img

                        src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIujywkLOXp1zcDUfrCqNGaIx5LkJ9gbPMjRn6"
                        alt="Decorative right"
                        className="hidden lg:block absolute right-0 top-0 w-32 xl:w-90 h-auto opacity-40 mb-10 -mr-30 mt-20 transform scale-x-[-1] pointer-events-none z-0 "
                    /> */}
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
                                className=" text-3xl text-white sm:text-4xl md:text-5xl font-inter font-bold flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center"
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
                                <p className="-mt-4 text-white md:mt-0 text-xl sm:text-xl md:text-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center"
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
                                        onSlideChange={handleSlideChange}
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
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Scroll Indicator */}

                </div>

                {/* How It Works Section - Below hero, requires scroll */}
                <div className="relative z-0  bg-gradient-to-t from-white  from-60% to-[#FBDADC] to-90%">
                    {/* Imágenes decorativas - detrás de ProjectsPreviewHero */}


                    <div className="relative z-10">
                        <ProjectsPreviewHero />
                    </div>


                    {/* Recent Presentations Panel - Only shown when user is signed in */}




                    {/* Footer */}


                </div>

                {/* Drag Drop Overlay */}

                {/* <DragDropOverlay files={files} setFiles={setFiles} /> */}

                <Footer />
            </div>


            <PricingPopup
                isOpen={showPricingPopup}
                onOpenChange={setShowPricingPopup}
            />
        </>
    )
}

