import PptxGenJS from 'pptxgenjs'
import { toast } from 'sonner'
import { AspectRatioType, DEFAULT_ASPECT_RATIO, getAspectRatioDimensions } from '../aspect-ratios'

/**
 * Helper functions for validation and sanitization
 */

// Validate and sanitize color values
function sanitizeColor(color: any, defaultColor: string = '000000'): string {
    if (!color || typeof color !== 'string') return defaultColor

    // Remove # if present
    let sanitized = color.replace('#', '')

    // Handle transparent or none
    if (sanitized === 'transparent' || sanitized === 'none' || sanitized === '') {
        return defaultColor
    }

    // Handle rgb/rgba formats - convert to hex
    if (sanitized.startsWith('rgb')) {
        const matches = sanitized.match(/\d+/g)
        if (matches && matches.length >= 3) {
            const r = parseInt(matches[0]).toString(16).padStart(2, '0')
            const g = parseInt(matches[1]).toString(16).padStart(2, '0')
            const b = parseInt(matches[2]).toString(16).padStart(2, '0')
            sanitized = r + g + b
        } else {
            return defaultColor
        }
    }

    // Validate hex format (3 or 6 characters)
    if (/^[0-9A-Fa-f]{3}$/.test(sanitized)) {
        // Convert 3-char hex to 6-char
        sanitized = sanitized.split('').map(c => c + c).join('')
    }

    if (/^[0-9A-Fa-f]{6}$/.test(sanitized)) {
        return sanitized
    }

    return defaultColor
}

// Validate and sanitize numeric values
function sanitizeNumber(value: any, defaultValue: number = 0, min?: number, max?: number): number {
    const num = typeof value === 'number' ? value : parseFloat(value)

    if (isNaN(num) || !isFinite(num)) {
        return defaultValue
    }

    if (min !== undefined && num < min) return min
    if (max !== undefined && num > max) return max

    return num
}

// Validate dimensions (must be positive)
function sanitizeDimension(value: any, defaultValue: number = 1, min?: number, max?: number): number {
    const num = sanitizeNumber(value, defaultValue)
    if (num <= 0) return defaultValue
    if (min !== undefined && num < min) return min
    if (max !== undefined && num > max) return max
    return num
}

// Clamp a value to be within slide bounds
function clampToSlide(value: number, maxValue: number): number {
    if (value < -maxValue) return -maxValue  // Allow some negative positioning
    if (value > maxValue * 2) return maxValue * 2  // Allow positioning slightly outside
    return value
}

export async function exportToPPT(slides: any[], aspectRatio: AspectRatioType = DEFAULT_ASPECT_RATIO) {
    if (slides.length === 0) {
        toast.error('No slides to export')
        return
    }

    const loadingToast = toast.loading('Downloading to PowerPoint...')

    try {
        const pptx = new PptxGenJS()

        // Get aspect ratio dimensions
        const aspectRatioDimensions = getAspectRatioDimensions(aspectRatio)
        const canvasWidth = aspectRatioDimensions.width
        const canvasHeight = aspectRatioDimensions.height

        console.log('🚀 [PPT-EXPORT] Aspect ratio:', aspectRatio, aspectRatioDimensions)

        // Set layout based on aspect ratio
        // For standard PowerPoint layouts, use predefined constants
        // For custom ratios, we'll use defineLayout() but only for non-standard ratios
        if (aspectRatio === '16:9') {
            pptx.layout = 'LAYOUT_16x9'
            console.log('✅ [PPT-EXPORT] Using standard 16:9 layout (10 x 5.625 inches)')
        } else if (aspectRatio === '4:3') {
            pptx.layout = 'LAYOUT_4x3'
            console.log('✅ [PPT-EXPORT] Using standard 4:3 layout (10 x 7.5 inches)')
        } else {
            // For non-standard aspect ratios, define custom dimensions
            // Convert pixels to inches (96 DPI standard)
            const slideWidthInches = canvasWidth / 96
            const slideHeightInches = canvasHeight / 96
            console.log('📐 [PPT-EXPORT] Defining custom layout:', slideWidthInches, 'x', slideHeightInches, 'inches')
            pptx.defineLayout({ name: 'CUSTOM', width: slideWidthInches, height: slideHeightInches })
            pptx.layout = 'CUSTOM'
            console.log('✅ [PPT-EXPORT] Custom layout set')
        }

        pptx.author = 'Astri'
        pptx.title = 'Presentación'

        // Calculate presentation dimensions in inches
        // These are the dimensions we'll use for scaling objects
        let slideWidth: number
        let slideHeight: number

        if (aspectRatio === '16:9') {
            slideWidth = 10
            slideHeight = 5.625
        } else if (aspectRatio === '4:3') {
            slideWidth = 10
            slideHeight = 7.5
        } else {
            // Custom dimensions based on actual pixels (96 DPI)
            slideWidth = canvasWidth / 96
            slideHeight = canvasHeight / 96
        }

        console.log('📏 [PPT-EXPORT] Slide dimensions for scaling:', slideWidth, 'x', slideHeight, 'inches')

        // Scale factors to convert from canvas pixels to inches
        const scaleX = slideWidth / canvasWidth
        const scaleY = slideHeight / canvasHeight

        console.log('🔢 [PPT-EXPORT] Scale factors: scaleX =', scaleX, 'scaleY =', scaleY)

        // Export each slide
        for (let i = 0; i < slides.length; i++) {
            const slideData = slides[i]
            const slide = pptx.addSlide()

            console.log(`\n📄 [PPT-EXPORT] Processing slide ${i + 1}/${slides.length}`)
            console.log(`   Objects in slide: ${slideData.objects?.length || 0}`)

            // Set background color with validation
            if (slideData.background) {
                const bgColor = sanitizeColor(slideData.background, 'FFFFFF')
                slide.background = { color: bgColor }
                console.log(`   Background: #${bgColor}`)
            }

            // Sort objects by zIndex to preserve layer order
            const sortedObjects = [...(slideData.objects || [])].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            // Process each object
            let objIndex = 0
            for (const obj of sortedObjects) {
                const objType = (obj.type || '').toLowerCase()
                const scaleXObj = obj.scaleX || 1
                const scaleYObj = obj.scaleY || 1
                const angle = obj.angle || 0

                console.log(`   [${objIndex + 1}/${sortedObjects.length}] Processing: ${objType}`)
                objIndex++

                // Skip objects with invalid types
                if (!objType || objType === '' || objType === 'undefined') {
                    console.warn(`   ⚠️  Skipping object with invalid type:`, obj)
                    continue
                }

                switch (objType) {
                    case 'text':
                    case 'i-text':
                    case 'itext':
                    case 'textbox':
                        try {
                            // Validate and sanitize text properties
                            const fontSize = sanitizeDimension(obj.fontSize, 40, 1, 500)
                            const fontSizePt = sanitizeDimension(fontSize * scaleYObj * scaleY * 72, 10, 1, 400)

                            // Calculate position with bounds checking
                            const textX = clampToSlide(sanitizeNumber(obj.left, 0) * scaleX, slideWidth)
                            const textY = clampToSlide(sanitizeNumber(obj.top, 0) * scaleY, slideHeight)

                            // Calculate width with max limit
                            const textW = sanitizeDimension(
                                obj.width ? obj.width * scaleXObj * scaleX : slideWidth * 0.8,
                                0.1,
                                0.1,
                                slideWidth * 3  // Max 3x slide width
                            )

                            // Calculate height: use object height if available, otherwise calculate based on font size and text content
                            let textHeight: number
                            if (obj.height && obj.height > 0) {
                                textHeight = sanitizeDimension(obj.height * scaleYObj * scaleY, 0.1, 0.1, slideHeight * 3)
                            } else if (obj.text) {
                                const textContent = String(obj.text || '')
                                const lineCount = Math.max(1, textContent.split('\n').length)
                                const fontSizeInches = sanitizeDimension(fontSize * scaleYObj * scaleY, 0.1)
                                textHeight = sanitizeDimension(fontSizeInches * lineCount * 1.4, 0.1, 0.1, slideHeight * 3)
                            } else {
                                textHeight = sanitizeDimension(fontSize * scaleYObj * scaleY * 1.4, 0.1, 0.1, slideHeight * 3)
                            }

                            const textOptions: any = {
                                x: textX,
                                y: textY,
                                w: textW,
                                h: textHeight,
                                fontSize: fontSizePt,
                                color: sanitizeColor(obj.fill, '000000'),
                                fontFace: obj.fontFamily || 'Arial',
                                bold: obj.fontWeight === 'bold',
                                italic: obj.fontStyle === 'italic',
                                align: obj.textAlign || 'left',
                                valign: 'top',
                            }

                            const sanitizedAngle = sanitizeNumber(angle, 0, -360, 360)
                            if (sanitizedAngle !== 0) {
                                textOptions.rotate = sanitizedAngle
                            }

                            const textContent = String(obj.text || '')
                            console.log(`      Text: "${textContent.substring(0, 30)}${textContent.length > 30 ? '...' : ''}" at (${textX.toFixed(2)}, ${textY.toFixed(2)}) ${textW.toFixed(2)}x${textHeight.toFixed(2)} inches, ${fontSizePt}pt`)

                            slide.addText(textContent, textOptions)
                        } catch (err) {
                            console.error('      ❌ Error adding text to PPT:', err)
                        }
                        break

                    case 'rect':
                    case 'rectangle':
                        try {
                            const rectX = clampToSlide(sanitizeNumber(obj.left, 0) * scaleX, slideWidth)
                            const rectY = clampToSlide(sanitizeNumber(obj.top, 0) * scaleY, slideHeight)
                            const rectW = sanitizeDimension((obj.width || 100) * scaleXObj * scaleX, 0.01, 0.01, slideWidth * 3)
                            const rectH = sanitizeDimension((obj.height || 100) * scaleYObj * scaleY, 0.01, 0.01, slideHeight * 3)

                            const rectOptions: any = {
                                x: rectX,
                                y: rectY,
                                w: rectW,
                                h: rectH,
                            }

                            if (obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none') {
                                rectOptions.fill = { color: sanitizeColor(obj.fill, '000000') }
                            }

                            if (obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none' && obj.strokeWidth) {
                                const strokeWidth = sanitizeDimension(obj.strokeWidth * scaleX * 72, 0, 0.1, 100)
                                if (strokeWidth > 0) {
                                    rectOptions.line = {
                                        color: sanitizeColor(obj.stroke, '000000'),
                                        width: strokeWidth
                                    }
                                }
                            }

                            const sanitizedAngle = sanitizeNumber(angle, 0, -360, 360)
                            if (sanitizedAngle !== 0) {
                                rectOptions.rotate = sanitizedAngle
                            }

                            console.log(`      Rectangle at (${rectX.toFixed(2)}, ${rectY.toFixed(2)}) ${rectW.toFixed(2)}x${rectH.toFixed(2)} inches`)
                            slide.addShape(pptx.ShapeType.rect, rectOptions)
                        } catch (err) {
                            console.error('      ❌ Error adding rectangle to PPT:', err)
                        }
                        break

                    case 'circle':
                        try {
                            const diameter = sanitizeDimension((obj.radius || 50) * 2, 1, 1, slideWidth * 3)
                            const circleX = clampToSlide(sanitizeNumber(obj.left, 0) * scaleX, slideWidth)
                            const circleY = clampToSlide(sanitizeNumber(obj.top, 0) * scaleY, slideHeight)
                            const circleW = sanitizeDimension(diameter * scaleXObj * scaleX, 0.01, 0.01, slideWidth * 3)
                            const circleH = sanitizeDimension(diameter * scaleYObj * scaleY, 0.01, 0.01, slideHeight * 3)

                            const circleOptions: any = {
                                x: circleX,
                                y: circleY,
                                w: circleW,
                                h: circleH,
                            }

                            if (obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none') {
                                circleOptions.fill = { color: sanitizeColor(obj.fill, '000000') }
                            }

                            if (obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none' && obj.strokeWidth) {
                                const strokeWidth = sanitizeDimension(obj.strokeWidth * scaleX * 72, 0, 0.1, 100)
                                if (strokeWidth > 0) {
                                    circleOptions.line = {
                                        color: sanitizeColor(obj.stroke, '000000'),
                                        width: strokeWidth
                                    }
                                }
                            }

                            const sanitizedAngle = sanitizeNumber(angle, 0, -360, 360)
                            if (sanitizedAngle !== 0) {
                                circleOptions.rotate = sanitizedAngle
                            }

                            console.log(`      Circle at (${circleX.toFixed(2)}, ${circleY.toFixed(2)}) ${circleW.toFixed(2)}x${circleH.toFixed(2)} inches`)
                            slide.addShape(pptx.ShapeType.ellipse, circleOptions)
                        } catch (err) {
                            console.error('      ❌ Error adding circle to PPT:', err)
                        }
                        break

                    case 'triangle':
                        try {
                            const triX = clampToSlide(sanitizeNumber(obj.left, 0) * scaleX, slideWidth)
                            const triY = clampToSlide(sanitizeNumber(obj.top, 0) * scaleY, slideHeight)
                            const triW = sanitizeDimension((obj.width || 100) * scaleXObj * scaleX, 0.01, 0.01, slideWidth * 3)
                            const triH = sanitizeDimension((obj.height || 100) * scaleYObj * scaleY, 0.01, 0.01, slideHeight * 3)

                            const triOptions: any = {
                                x: triX,
                                y: triY,
                                w: triW,
                                h: triH,
                            }

                            if (obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none') {
                                triOptions.fill = { color: sanitizeColor(obj.fill, '000000') }
                            }

                            if (obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none' && obj.strokeWidth) {
                                const strokeWidth = sanitizeDimension(obj.strokeWidth * scaleX * 72, 0, 0.1, 100)
                                if (strokeWidth > 0) {
                                    triOptions.line = {
                                        color: sanitizeColor(obj.stroke, '000000'),
                                        width: strokeWidth
                                    }
                                }
                            }

                            const sanitizedAngle = sanitizeNumber(angle, 0, -360, 360)
                            if (sanitizedAngle !== 0) {
                                triOptions.rotate = sanitizedAngle
                            }

                            console.log(`      Triangle at (${triX.toFixed(2)}, ${triY.toFixed(2)}) ${triW.toFixed(2)}x${triH.toFixed(2)} inches`)
                            slide.addShape(pptx.ShapeType.triangle, triOptions)
                        } catch (err) {
                            console.error('      ❌ Error adding triangle to PPT:', err)
                        }
                        break

                    case 'line':
                        try {
                            const x1 = sanitizeNumber(obj.x1, 0)
                            const y1 = sanitizeNumber(obj.y1, 0)
                            const x2 = sanitizeNumber(obj.x2, 100)
                            const y2 = sanitizeNumber(obj.y2, 100)

                            // Calculate line dimensions - ensure they're not both zero
                            let lineW = (x2 - x1) * scaleX
                            let lineH = (y2 - y1) * scaleY

                            // If line is too small, skip it (degenerate line)
                            if (Math.abs(lineW) < 0.001 && Math.abs(lineH) < 0.001) {
                                console.warn('      ⚠️  Skipping degenerate line (zero length)')
                                break
                            }

                            const lineX = clampToSlide(x1 * scaleX, slideWidth)
                            const lineY = clampToSlide(y1 * scaleY, slideHeight)

                            const lineOptions: any = {
                                x: lineX,
                                y: lineY,
                                w: lineW,
                                h: lineH,
                                line: {
                                    color: sanitizeColor(obj.stroke, '000000'),
                                    width: sanitizeDimension(obj.strokeWidth * scaleX * 72, 0.5, 0.1, 100)
                                }
                            }

                            console.log(`      Line from (${lineX.toFixed(2)}, ${lineY.toFixed(2)}) length ${Math.sqrt(lineW * lineW + lineH * lineH).toFixed(2)} inches`)
                            slide.addShape(pptx.ShapeType.line, lineOptions)
                        } catch (err) {
                            console.error('      ❌ Error adding line to PPT:', err)
                        }
                        break

                    case 'image':
                        if (obj.src && typeof obj.src === 'string' && obj.src.length > 0) {
                            try {
                                // Calculate and validate image dimensions
                                const imgX = clampToSlide(sanitizeNumber(obj.left, 0) * scaleX, slideWidth)
                                const imgY = clampToSlide(sanitizeNumber(obj.top, 0) * scaleY, slideHeight)
                                const imgW = sanitizeDimension((obj.width || 200) * scaleXObj * scaleX, 0.1, 0.1, slideWidth * 3)
                                const imgH = sanitizeDimension((obj.height || 200) * scaleYObj * scaleY, 0.1, 0.1, slideHeight * 3)

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
                                    console.log(`      Image (URL) at (${imgX.toFixed(2)}, ${imgY.toFixed(2)}) ${imgW.toFixed(2)}x${imgH.toFixed(2)} inches`)
                                } else if (obj.src.startsWith('data:image/')) {
                                    // Already a proper data URL
                                    imgOptions.data = obj.src
                                    console.log(`      Image (data URL) at (${imgX.toFixed(2)}, ${imgY.toFixed(2)}) ${imgW.toFixed(2)}x${imgH.toFixed(2)} inches`)
                                } else if (obj.src.startsWith('data:')) {
                                    // Data URL but might not have image/ prefix
                                    imgOptions.data = obj.src
                                    console.log(`      Image (data) at (${imgX.toFixed(2)}, ${imgY.toFixed(2)}) ${imgW.toFixed(2)}x${imgH.toFixed(2)} inches`)
                                } else {
                                    // Assume it's base64 without header, add proper header
                                    imgOptions.data = `data:image/png;base64,${obj.src}`
                                    console.log(`      Image (base64) at (${imgX.toFixed(2)}, ${imgY.toFixed(2)}) ${imgW.toFixed(2)}x${imgH.toFixed(2)} inches`)
                                }

                                const sanitizedAngle = sanitizeNumber(angle, 0, -360, 360)
                                if (sanitizedAngle !== 0) {
                                    imgOptions.rotate = sanitizedAngle
                                }

                                slide.addImage(imgOptions)
                            } catch (err) {
                                console.error('      ❌ Error adding image to PPT:', err)
                                console.error('      Image source (first 100 chars):', obj.src?.substring(0, 100))
                            }
                        }
                        break
                }
            }
        }

        // Save PowerPoint
        console.log('\n💾 [PPT-EXPORT] Saving PowerPoint file...')
        await pptx.writeFile({ fileName: 'presentacion.pptx' })
        console.log('✅ [PPT-EXPORT] File saved successfully: presentacion.pptx')

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success('PowerPoint exported successfully')
        console.log('🎉 [PPT-EXPORT] Export completed!')
    } catch (error) {
        console.error('❌ [PPT-EXPORT] Fatal error:', error)
        toast.dismiss(loadingToast)
        toast.error('Error exporting to PowerPoint')
    }
}