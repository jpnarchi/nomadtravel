'use client'

/**
 * Aspect Ratio Selector Component
 *
 * Allows users to select different aspect ratios for their presentations
 */

import { AspectRatioType, getAvailableAspectRatios } from '@/lib/aspect-ratios'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface AspectRatioSelectorProps {
    value: AspectRatioType
    onValueChange: (value: AspectRatioType) => void
    disabled?: boolean
}

export function AspectRatioSelector({
    value,
    onValueChange,
    disabled = false,
}: AspectRatioSelectorProps) {
    const aspectRatios = getAvailableAspectRatios()
    const currentRatio = aspectRatios.find(({ key }) => key === value)

    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className="w-[140px] bg-white border-gray-300 hover:bg-gray-50 transition-colors">
                {currentRatio ? (
                    <span className="font-semibold text-gray-900">{currentRatio.data.label}</span>
                ) : (
                    <SelectValue placeholder="Select ratio" />
                )}
            </SelectTrigger>
            <SelectContent className="w-[220px]">
                {aspectRatios.map(({ key, data }) => (
                    <SelectItem
                        key={key}
                        value={key}
                        className="cursor-pointer"
                    >
                        <div className="flex flex-col gap-0.5 py-0.5">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">{data.label}</span>
                                <span className="text-xs font-mono text-gray-600 ml-3">
                                    {data.width}×{data.height}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500">
                                {data.description}
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
