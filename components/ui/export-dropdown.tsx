'use client'

import { useState } from 'react'
import { FileText, Presentation, Download, Crown } from 'lucide-react'
import { Button } from './button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './select'
import { PDFQuality } from '@/lib/export/pdf-exporter'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'

interface ExportDropdownProps {
    onExportPDF: (quality: PDFQuality) => void
    onExportPPT: () => void
    triggerText?: string
    triggerIcon?: React.ReactNode
    variant?: 'default' | 'outline'
    className?: string
    onUpgradeClick?: () => void
}

type ExportFormat = 'pdf' | 'ppt' | null

export function ExportDropdown({
    onExportPDF,
    onExportPPT,
    triggerText = 'Share',
    triggerIcon,
    variant = 'default',
    className = 'gap-2',
    onUpgradeClick
}: ExportDropdownProps) {
    const [open, setOpen] = useState(false)
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
    const [selectedQuality, setSelectedQuality] = useState<PDFQuality>('standard')
    const [showUpgradeMessage, setShowUpgradeMessage] = useState(false)

    const router = useRouter()
    const user = useQuery(api.users.getUserInfo)
    // User is considered paid if they have an active subscription
    const isPaidUser = !!user?.subscriptionId
    const isFreeUser = !user?.subscriptionId

    const handleUpgradeClick = () => {
        setOpen(false)
        if (onUpgradeClick) {
            onUpgradeClick()
        } else {
            router.push('/pricing')
        }
    }

    const handleDownload = () => {
        if (selectedFormat === 'pdf') {
            onExportPDF(selectedQuality)
            setOpen(false)
            setSelectedFormat(null)
            setSelectedQuality('standard')
        } else if (selectedFormat === 'ppt') {
            if (isFreeUser) {
                setShowUpgradeMessage(true)
            } else {
                onExportPPT()
                setOpen(false)
                setSelectedFormat(null)
                setSelectedQuality('standard')
            }
        }
    }

    const handlePPTSelection = () => {
        if (isFreeUser) {
            // For free users, show the upgrade message but don't change format
            setShowUpgradeMessage(true)
            setSelectedFormat('ppt') // Set to ppt to trigger the message display
        } else {
            // For paid users, simply select the format
            setSelectedFormat('ppt')
            setShowUpgradeMessage(false)
        }
    }

    const canDownload = selectedFormat !== null &&
        (selectedFormat === 'ppt' ? !isFreeUser : selectedQuality !== null)

    // Reset state when dialog opens/closes
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            // Reset when closing
            setShowUpgradeMessage(false)
            setSelectedFormat('pdf')
            setSelectedQuality('standard')
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    size="sm"
                    className={className}
                >
                    {triggerIcon}
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className='font-[family-name:var(--font-ppmori-semibold)]'>Export Presentation</DialogTitle>
                    <DialogDescription>
                        Select the format to download your presentation
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Format Selection */}
                    <div className="space-y-3 -mt-4">
                        <label className="text-sm font-medium">Select format:</label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {/* PDF Option */}
                            <button
                                onClick={() => {
                                    setSelectedFormat('pdf')
                                    setShowUpgradeMessage(false)
                                }}
                                className={`
                                    relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                                    ${selectedFormat === 'pdf'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                        : 'border-border hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/50'
                                    }
                                `}
                            >
                                <FileText className="size-8 text-black" />
                                <div className="text-center">
                                    <div className="font-medium text-sm">PDF Format</div>
                                    <div className="text-xs text-muted-foreground">Portable Document</div>
                                </div>
                                {selectedFormat === 'pdf' && (
                                    <div className="absolute top-2 right-2 size-5 bg-red-500 rounded-full flex items-center justify-center">
                                        <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* PowerPoint Option */}
                            <button
                                onClick={handlePPTSelection}
                                className={`
                                    relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                                    ${selectedFormat === 'ppt'
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                                        : 'border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/50'
                                    }
                                `}
                            >
                                {isFreeUser && (
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                                        <Crown className="size-3" />
                                        Pro
                                    </div>
                                )}
                                <img src="/powerpoint.png" alt="Power point Icon" className="size-8 text-orange-500" />
                                <div className="text-center">
                                    <div className="font-medium text-sm">PowerPoint</div>
                                    <div className="text-xs text-muted-foreground">Microsoft PPT</div>
                                </div>
                                {selectedFormat === 'ppt' && !isFreeUser && (
                                    <div className="absolute top-2 right-2 size-5 bg-orange-500 rounded-full flex items-center justify-center">
                                        <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Upgrade Message for Free Users - Only show when PowerPoint is selected */}
                    {showUpgradeMessage && isFreeUser && selectedFormat === 'ppt' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 -mt-2">
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <Crown className="size-5 text-orange-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-[family-name:var(--font-ppmori-semibold)] text-sm text-gray-900 mb-1">
                                            Upgrade to Export PowerPoint
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            PowerPoint export is available for Pro, Premium, and Ultra users. Upgrade now to unlock this feature!
                                        </p>
                                        <Button
                                            onClick={handleUpgradeClick}
                                            size="sm"
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                        >
                                            <Crown className="size-4 mr-2" />
                                            Upgrade Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PDF Quality Selector */}
                    {selectedFormat === 'pdf' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 -mt-2">
                            <label className="text-sm font-medium">PDF Quality:</label>
                            <Select value={selectedQuality} onValueChange={(value) => setSelectedQuality(value as PDFQuality)}>
                                <SelectTrigger className="w-full py-8 mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className=" z-[10000]">
                                    <SelectItem value="standard">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                            <span className="font-medium">Standard Quality</span>
                                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Recommended</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">2x resolution • Faster export</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="high">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">High Quality</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">3x resolution • Best balance</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Download Button */}
                    <Button
                        onClick={handleDownload}
                        disabled={!canDownload}
                        className="w-full bg-red-600 -mt-2 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                        <Download className="size-4 mr-2" />
                        Download {selectedFormat === 'pdf' ? 'PDF' : selectedFormat === 'ppt' ? 'PowerPoint' : ''}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
