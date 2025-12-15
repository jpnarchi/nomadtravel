/**
 * Toolbar superior del editor de presentaciones
 */

import { Button } from '@/components/ui/button'
import { AspectRatioSelector } from '../aspect-ratio-selector'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { Loader } from '@/components/ai-elements/loader'
import {
    ArrowLeft,
    Eye,
    Code,
    Save,
    Share
} from 'lucide-react'
import { AspectRatioType } from '@/lib/aspect-ratios'
import { PDFQuality } from '@/lib/export/pdf-exporter'

interface PresentationToolbarProps {
    isBackButtonLoading: boolean
    hasUnsavedChanges: boolean
    isSaving: boolean
    isAdmin: boolean
    showCode: boolean
    aspectRatio: AspectRatioType
    isFullscreen: boolean
    onReturnToChat: () => void
    onToggleCode: () => void
    onAspectRatioChange: (ratio: AspectRatioType) => void
    onPDFExport: (quality: PDFQuality) => void
    onPPTExport: () => void
    onToggleFullscreen: () => void
    onSave: () => void
}

export function PresentationToolbar({
    isBackButtonLoading,
    hasUnsavedChanges,
    isSaving,
    isAdmin,
    showCode,
    aspectRatio,
    isFullscreen,
    onReturnToChat,
    onToggleCode,
    onAspectRatioChange,
    onPDFExport,
    onPPTExport,
    onToggleFullscreen,
    onSave
}: PresentationToolbarProps) {
    return (
        <div
            className="bg-white border-b border-zinc-800 p-4 grid grid-cols-3 items-center"
            style={{ backgroundImage: "url('/img/background2.svg')" }}
        >
            {/* Left side */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    className="cursor-pointer text-black hover:bg-muted-500 hover:text-gray"
                    onClick={onReturnToChat}
                >
                    {isBackButtonLoading ? <Loader /> : <ArrowLeft className="size-4" />}
                    {isBackButtonLoading ? "Loading" : "Return to Chat"}
                </Button>

                <div className="h-8 w-px bg-gray-300" />

                <h2 className="text-xl text-black font-[family-name:var(--font-ppmori-semibold)]">
                    Presentation Editor
                </h2>
            </div>

            {/* Center - Logo and Aspect Ratio Selector */}
            <div className="flex items-center justify-center gap-4">
                <img src="/logo.png" alt="Logo" className="h-12" />
                <div className="h-8 w-px bg-gray-300" />
                <AspectRatioSelector
                    value={aspectRatio}
                    onValueChange={onAspectRatioChange}
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 justify-end">
                {isAdmin && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleCode}
                    >
                        {showCode ? <Eye className="size-4" /> : <Code className="size-4" />}
                    </Button>
                )}

                <ExportDropdown
                    onExportPDF={onPDFExport}
                    onExportPPT={onPPTExport}
                    triggerText="Share"
                    triggerIcon={<Share className="size-4 mr-2" />}
                    variant="default"
                    className="transition-all border-1 p-6 px-4"
                />

                <Button
                    size="sm"
                    onClick={onToggleFullscreen}
                    className="border-1 transition-all p-6"
                >
                    <img src="/presentation-icon.svg" alt="Present" className="size-6" />
                    {isFullscreen ? 'Exit' : 'Present'}
                </Button>

                <Button
                    variant="default"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={hasUnsavedChanges
                        ? 'relative overflow-hidden bg-gradient-to-r from-[#E5332D] via-[#db3f42] to-[#BD060A] bg-[length:200%_100%] animate-gradient-x hover:shadow-lg hover:shadow-[#E5332D]/50 transition-all duration-300 p-6 border-1'
                        : ''
                    }
                >
                    {isSaving ? (
                        <>
                            <Loader />
                            <span className="ml-2">Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save className="mr-2" />
                            {hasUnsavedChanges ? 'Save Changes' : 'All Saved'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
