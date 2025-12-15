/**
 * Hook para manejar las exportaciones (PDF/PowerPoint)
 */

import { useParams } from 'next/navigation'
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from 'sonner'
import { exportToPDF, PDFQuality } from '@/lib/export/pdf-exporter'
import { exportToPPT } from '@/lib/export/ppt-exporter'
import { AspectRatioType } from '@/lib/aspect-ratios'

interface UserInfo {
    role?: string
    plan?: string
}

interface UseExportHandlersProps {
    slides: any[]
    aspectRatio: AspectRatioType
    userInfo: UserInfo | null | undefined
}

export function useExportHandlers({ slides, aspectRatio, userInfo }: UseExportHandlersProps) {
    const params = useParams()
    const updateProjectDownloaded = useMutation(api.chats.updateProjectDownloaded)

    // Check if user can export to PowerPoint
    const canExportToPPT = () => {
        if (!userInfo) return false
        if (userInfo.role === 'admin') return true
        if (userInfo.plan === 'pro' || userInfo.plan === 'premium' || userInfo.plan === 'ultra') return true
        return false
    }

    // Handle PowerPoint export
    const handlePPTExport = async () => {
        if (!canExportToPPT()) {
            toast.error('PowerPoint export is only available for Pro, Premium, and Ultra users', {
                description: 'Upgrade your plan to unlock this feature'
            })
            return
        }
        exportToPPT(slides.map(slide => slide.data), aspectRatio)

        const chatId = params?.id || params?.chatId
        if (chatId) {
            try {
                await updateProjectDownloaded({ chatId: chatId as any, downloaded: true })
            } catch (error) {
                console.error('Error updating project download status:', error)
            }
        }
    }

    // Handle PDF export
    const handlePDFExport = async (quality: PDFQuality = 'high') => {
        exportToPDF(slides.map(slide => slide.data), aspectRatio, quality)

        const chatId = params?.id || params?.chatId
        if (chatId) {
            try {
                await updateProjectDownloaded({ chatId: chatId as any, downloaded: true })
            } catch (error) {
                console.error('Error updating project download status:', error)
            }
        }
    }

    return {
        canExportToPPT,
        handlePPTExport,
        handlePDFExport
    }
}
