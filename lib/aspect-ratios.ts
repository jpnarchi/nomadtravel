/**
 * Aspect Ratio Configuration
 *
 * Defines all available aspect ratios for presentations
 */

export type AspectRatioType = '16:9' | '4:3' | '1:1' | '9:16' | '21:9' | 'A4'

export interface AspectRatioDimensions {
    width: number
    height: number
    ratio: number
    label: string
    description: string
}

export const ASPECT_RATIOS: Record<AspectRatioType, AspectRatioDimensions> = {
    '16:9': {
        width: 1920,
        height: 1080,
        ratio: 16 / 9,
        label: '16:9',
        description: 'Standard (HD)'
    },
    '4:3': {
        width: 1600,
        height: 1200,
        ratio: 4 / 3,
        label: '4:3',
        description: 'Classic'
    },
    '1:1': {
        width: 1080,
        height: 1080,
        ratio: 1,
        label: '1:1',
        description: 'Square'
    },
    '9:16': {
        width: 1080,
        height: 1920,
        ratio: 9 / 16,
        label: '9:16',
        description: 'Vertical (Stories)'
    },
    '21:9': {
        width: 2560,
        height: 1080,
        ratio: 21 / 9,
        label: '21:9',
        description: 'Ultra-wide'
    },
    'A4': {
        width: 794,
        height: 1123,
        ratio: 210 / 297,
        label: 'A4',
        description: 'A4 Paper (210×297mm)'
    }
}

export const DEFAULT_ASPECT_RATIO: AspectRatioType = '16:9'

/**
 * Get dimensions for a given aspect ratio
 */
export function getAspectRatioDimensions(aspectRatio: AspectRatioType): AspectRatioDimensions {
    return ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS[DEFAULT_ASPECT_RATIO]
}

/**
 * Get all available aspect ratios as an array
 */
export function getAvailableAspectRatios(): { key: AspectRatioType; data: AspectRatioDimensions }[] {
    return Object.entries(ASPECT_RATIOS).map(([key, data]) => ({
        key: key as AspectRatioType,
        data
    }))
}

/**
 * Calculate canvas scale to fit in a container
 */
export function calculateCanvasScale(
    aspectRatio: AspectRatioType,
    containerWidth: number,
    containerHeight: number
): { scale: number; displayWidth: number; displayHeight: number } {
    const dimensions = getAspectRatioDimensions(aspectRatio)

    const scaleX = containerWidth / dimensions.width
    const scaleY = containerHeight / dimensions.height
    const scale = Math.min(scaleX, scaleY, 1)

    const displayWidth = dimensions.width * scale
    const displayHeight = dimensions.height * scale

    return { scale, displayWidth, displayHeight }
}
