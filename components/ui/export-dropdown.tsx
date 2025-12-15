'use client'

import { useState } from 'react'
import { FileText, Presentation, Download } from 'lucide-react'
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

interface ExportDropdownProps {
    onExportPDF: (quality: PDFQuality) => void
    onExportPPT: () => void
    triggerText?: string
    triggerIcon?: React.ReactNode
    variant?: 'default' | 'outline'
    className?: string
}

type ExportFormat = 'pdf' | 'ppt' | null

export function ExportDropdown({
    onExportPDF,
    onExportPPT,
    triggerText = 'Share',
    triggerIcon,
    variant = 'default',
    className = 'gap-2'
}: ExportDropdownProps) {
    const [open, setOpen] = useState(false)
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
    const [selectedQuality, setSelectedQuality] = useState<PDFQuality>('standard')
    

    const handleDownload = () => {
        if (selectedFormat === 'pdf') {
            onExportPDF(selectedQuality)
        } else if (selectedFormat === 'ppt') {
            onExportPPT()
        }
        setOpen(false)
        setSelectedFormat(null)
        setSelectedQuality('standard')
    }

    const canDownload = selectedFormat !== null && (selectedFormat === 'ppt' || selectedQuality !== null)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                    <DialogTitle>Export Presentation</DialogTitle>
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
                                onClick={() => setSelectedFormat('pdf')}
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
                                onClick={() => setSelectedFormat('ppt')}
                                className={`
                                    relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                                    ${selectedFormat === 'ppt'
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                                        : 'border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/50'
                                    }
                                `}
                            >
                                <img src="/powerpoint.png" alt="Power point Icon" className="size-8 text-orange-500" />
                                <div className="text-center">
                                    <div className="font-medium text-sm">PowerPoint</div>
                                    <div className="text-xs text-muted-foreground">Microsoft PPT</div>
                                </div>
                                {selectedFormat === 'ppt' && (
                                    <div className="absolute top-2 right-2 size-5 bg-orange-500 rounded-full flex items-center justify-center">
                                        <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

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
