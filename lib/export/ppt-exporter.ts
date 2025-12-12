import PptxGenJS from 'pptxgenjs'
import { toast } from 'sonner'
import { AspectRatioType, DEFAULT_ASPECT_RATIO, getAspectRatioDimensions } from '../aspect-ratios'

// PowerPoint layout mappings
const PPT_LAYOUTS: Record<AspectRatioType, string> = {
    '16:9': 'LAYOUT_16x9',
    '4:3': 'LAYOUT_4x3',
    '1:1': 'LAYOUT_WIDE', // Custom square layout
    '9:16': 'LAYOUT_WIDE', // Custom portrait layout
    '21:9': 'LAYOUT_WIDE', // Custom ultra-wide layout
    'A4': 'LAYOUT_WIDE', // Custom A4 layout (210x297mm)
}

// Helper function to ensure values are within valid PowerPoint ranges
function clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

// Helper function to ensure coordinates are non-negative
function ensureNonNegative(value: number): number {
    return Math.max(0, value)
}

export async function exportToPPT(slides: any[], aspectRatio: AspectRatioType = DEFAULT_ASPECT_RATIO) {
    if (slides.length === 0) {
        toast.error('No slides to export')
        return
    }

    const aspectRatioDimensions = getAspectRatioDimensions(aspectRatio)
    console.log('🚀 [PPT-EXPORT] Exportación iniciada con', slides.length, 'slides')
    console.log('🚀 [PPT-EXPORT] Aspect ratio:', aspectRatio, aspectRatioDimensions)

    const loadingToast = toast.loading('Downloading to PowerPoint...')

    try {
        const pptx = new PptxGenJS()

        // Set presentation size based on aspect ratio
        const pptLayout = PPT_LAYOUTS[aspectRatio] || 'LAYOUT_16x9'

        // For standard layouts, use PowerPoint presets
        if (pptLayout === 'LAYOUT_16x9' || pptLayout === 'LAYOUT_4x3') {
            pptx.layout = pptLayout
        } else {
            // For custom layouts, define width and height in inches
            // PowerPoint uses inches as the unit
            // PowerPoint limits: width 1-56 inches, height 1-56 inches
            const isPortrait = aspectRatioDimensions.height > aspectRatioDimensions.width

            let slideWidthInches: number
            let slideHeightInches: number

            if (isPortrait) {
                // For portrait orientations, fix height and calculate width
                const referenceHeight = 10
                slideHeightInches = referenceHeight
                slideWidthInches = referenceHeight * aspectRatioDimensions.ratio
            } else {
                // For landscape orientations, fix width and calculate height
                const referenceWidth = 10
                slideWidthInches = referenceWidth
                slideHeightInches = referenceWidth / aspectRatioDimensions.ratio
            }

            // Ensure dimensions are within PowerPoint limits (1-56 inches)
            slideWidthInches = Math.max(1, Math.min(56, slideWidthInches))
            slideHeightInches = Math.max(1, Math.min(56, slideHeightInches))

            console.log('📐 [PPT-EXPORT] Custom layout:', {
                aspectRatio,
                isPortrait,
                widthInches: slideWidthInches,
                heightInches: slideHeightInches
            })

            pptx.defineLayout({ name: 'CUSTOM', width: slideWidthInches, height: slideHeightInches })
            pptx.layout = 'CUSTOM'
        }

        pptx.author = 'Astri'
        pptx.title = 'Presentación'

        // Presentation dimensions in inches
        const slideWidth = pptx.presLayout.width
        const slideHeight = pptx.presLayout.height

        console.log('✅ [PPT-EXPORT] PowerPoint layout:', pptLayout, slideWidth, 'x', slideHeight, 'inches')

        // Scale factors to convert from canvas pixels to inches
        const scaleX = slideWidth / aspectRatioDimensions.width
        const scaleY = slideHeight / aspectRatioDimensions.height

        // Export each slide
        for (let i = 0; i < slides.length; i++) {
            const slideData = slides[i]
            const slide = pptx.addSlide()

            // Set background color
            if (slideData.background) {
                slide.background = { color: slideData.background.replace('#', '') }
            }

            // Sort objects by zIndex to preserve layer order
            const sortedObjects = [...(slideData.objects || [])].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            // Process each object
            for (const obj of sortedObjects) {
                const objType = (obj.type || '').toLowerCase()
                const scaleXObj = obj.scaleX || 1
                const scaleYObj = obj.scaleY || 1
                const angle = obj.angle || 0

                switch (objType) {
                    case 'text':
                    case 'i-text':
                    case 'itext':
                    case 'textbox':
                        // Add text as editable text box
                        // Convert fontSize from pixels to points considering scale
                        // 1 inch = 72 points, so: pixels * (inches per pixel) * 72 = points
                        const fontSizePt = clampValue((obj.fontSize || 40) * scaleYObj * scaleY * 72, 1, 400)

                        // Calculate height: use object height if available, otherwise calculate based on font size and text content
                        let textHeight: number | string = 'auto'
                        if (obj.height) {
                            // Use the actual height from the object
                            textHeight = clampValue(obj.height * scaleYObj * scaleY, 0.1, slideHeight)
                        } else if (obj.text) {
                            // Calculate approximate height based on font size and line breaks
                            const textContent = obj.text || ''
                            const lineCount = textContent.split('\n').length
                            const fontSizeInches = (obj.fontSize || 40) * scaleYObj * scaleY
                            // Use line height of approximately 1.4 times font size
                            textHeight = clampValue(fontSizeInches * lineCount * 1.4, 0.1, slideHeight)
                        }

                        const textOptions: any = {
                            x: ensureNonNegative((obj.left || 0) * scaleX),
                            y: ensureNonNegative((obj.top || 0) * scaleY),
                            w: clampValue(obj.width ? obj.width * scaleXObj * scaleX : slideWidth * 0.8, 0.1, slideWidth),
                            h: textHeight,
                            fontSize: fontSizePt,
                            color: (obj.fill || '#000000').replace('#', ''),
                            fontFace: obj.fontFamily || 'Arial',
                            bold: obj.fontWeight === 'bold',
                            italic: obj.fontStyle === 'italic',
                            align: obj.textAlign || 'left',
                            valign: 'top',
                        }

                        if (angle !== 0 && angle !== undefined) {
                            textOptions.rotate = clampValue(angle, -360, 360)
                        }

                        slide.addText(obj.text || '', textOptions)
                        break

                    case 'rect':
                    case 'rectangle':
                        const rectOptions: any = {
                            x: ensureNonNegative((obj.left || 0) * scaleX),
                            y: ensureNonNegative((obj.top || 0) * scaleY),
                            w: clampValue((obj.width || 100) * scaleXObj * scaleX, 0.01, slideWidth),
                            h: clampValue((obj.height || 100) * scaleYObj * scaleY, 0.01, slideHeight),
                        }

                        if (obj.fill) {
                            rectOptions.fill = { color: obj.fill.replace('#', '') }
                        }

                        if (obj.stroke && obj.strokeWidth) {
                            const strokeWidthPt = clampValue((obj.strokeWidth || 1) * scaleX * 72, 0, 50)
                            if (strokeWidthPt > 0) {
                                rectOptions.line = {
                                    color: obj.stroke.replace('#', ''),
                                    width: strokeWidthPt
                                }
                            }
                        }

                        if (angle !== 0 && angle !== undefined) {
                            rectOptions.rotate = clampValue(angle, -360, 360)
                        }

                        slide.addShape(pptx.ShapeType.rect, rectOptions)
                        break

                    case 'circle':
                        const diameter = (obj.radius || 50) * 2
                        const circleOptions: any = {
                            x: ensureNonNegative((obj.left || 0) * scaleX),
                            y: ensureNonNegative((obj.top || 0) * scaleY),
                            w: clampValue(diameter * scaleXObj * scaleX, 0.01, slideWidth),
                            h: clampValue(diameter * scaleYObj * scaleY, 0.01, slideHeight),
                        }

                        if (obj.fill) {
                            circleOptions.fill = { color: obj.fill.replace('#', '') }
                        }

                        if (obj.stroke && obj.strokeWidth) {
                            const strokeWidthPt = clampValue((obj.strokeWidth || 1) * scaleX * 72, 0, 50)
                            if (strokeWidthPt > 0) {
                                circleOptions.line = {
                                    color: obj.stroke.replace('#', ''),
                                    width: strokeWidthPt
                                }
                            }
                        }

                        if (angle !== 0 && angle !== undefined) {
                            circleOptions.rotate = clampValue(angle, -360, 360)
                        }

                        slide.addShape(pptx.ShapeType.ellipse, circleOptions)
                        break

                    case 'triangle':
                        const triOptions: any = {
                            x: ensureNonNegative((obj.left || 0) * scaleX),
                            y: ensureNonNegative((obj.top || 0) * scaleY),
                            w: clampValue((obj.width || 100) * scaleXObj * scaleX, 0.01, slideWidth),
                            h: clampValue((obj.height || 100) * scaleYObj * scaleY, 0.01, slideHeight),
                        }

                        if (obj.fill) {
                            triOptions.fill = { color: obj.fill.replace('#', '') }
                        }

                        if (obj.stroke && obj.strokeWidth) {
                            const strokeWidthPt = clampValue((obj.strokeWidth || 1) * scaleX * 72, 0, 50)
                            if (strokeWidthPt > 0) {
                                triOptions.line = {
                                    color: obj.stroke.replace('#', ''),
                                    width: strokeWidthPt
                                }
                            }
                        }

                        if (angle !== 0 && angle !== undefined) {
                            triOptions.rotate = clampValue(angle, -360, 360)
                        }

                        slide.addShape(pptx.ShapeType.triangle, triOptions)
                        break

                    case 'line':
                        const lineOptions: any = {
                            x: ensureNonNegative((obj.x1 || 0) * scaleX),
                            y: ensureNonNegative((obj.y1 || 0) * scaleY),
                            w: clampValue(((obj.x2 || 100) - (obj.x1 || 0)) * scaleX, -slideWidth, slideWidth),
                            h: clampValue(((obj.y2 || 100) - (obj.y1 || 0)) * scaleY, -slideHeight, slideHeight),
                            line: {
                                color: (obj.stroke || '#000000').replace('#', ''),
                                width: clampValue((obj.strokeWidth || 1) * scaleX * 72, 0.1, 50)
                            }
                        }

                        slide.addShape(pptx.ShapeType.line, lineOptions)
                        break

                    case 'image':
                        if (obj.src) {
                            try {
                                // Calculate actual image dimensions from object properties
                                const imgW = clampValue((obj.width || 200) * scaleXObj * scaleX, 0.01, slideWidth)
                                const imgH = clampValue((obj.height || 200) * scaleYObj * scaleY, 0.01, slideHeight)

                                // CRITICAL: Convert from Fabric.js coordinates to PowerPoint coordinates
                                // Fabric.js images can have origin at 'center', but PowerPoint always uses top-left
                                let imgX = (obj.left || 0) * scaleX
                                let imgY = (obj.top || 0) * scaleY

                                // If image has center origin, convert to top-left origin for PPT
                                if (obj.originX === 'center') {
                                    imgX = imgX - (imgW / 2)
                                }
                                if (obj.originY === 'center') {
                                    imgY = imgY - (imgH / 2)
                                }

                                // Ensure coordinates are within slide bounds
                                imgX = clampValue(imgX, 0, slideWidth - 0.1)
                                imgY = clampValue(imgY, 0, slideHeight - 0.1)

                                const imgOptions: any = {
                                    x: imgX,
                                    y: imgY,
                                    w: imgW,
                                    h: imgH,
                                }

                                // Handle different image source formats
                                if (obj.src.startsWith('http://') || obj.src.startsWith('https://')) {
                                    // Use 'path' for HTTP URLs
                                    imgOptions.path = obj.src
                                } else if (obj.src.startsWith('data:')) {
                                    // Already a proper data URL
                                    imgOptions.data = obj.src
                                } else {
                                    // Assume it's base64 without header, add proper header
                                    imgOptions.data = `data:image/png;base64,${obj.src}`
                                }

                                if (angle !== 0 && angle !== undefined) {
                                    imgOptions.rotate = clampValue(angle, -360, 360)
                                }

                                slide.addImage(imgOptions)
                            } catch (err) {
                                console.error('Error adding image to PPT:', err, 'Image src:', obj.src?.substring(0, 100))
                            }
                        }
                        break
                }
            }
        }

        // Save PowerPoint
        await pptx.writeFile({ fileName: 'presentacion.pptx' })

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success('PowerPoint exported successfully')
    } catch (error) {
        console.error('Error exporting to PowerPoint:', error)
        toast.dismiss(loadingToast)
        toast.error('Error exporting to PowerPoint')
    }
}
