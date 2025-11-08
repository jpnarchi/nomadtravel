import PptxGenJS from 'pptxgenjs'
import { toast } from 'sonner'

export async function exportToPPT(slides: any[]) {
    if (slides.length === 0) {
        toast.error('No slides to export')
        return
    }

    const loadingToast = toast.loading('Downloading to PowerPoint...')

    try {
        const pptx = new PptxGenJS()

        // Set presentation size to 16:9 (10 x 5.625 inches)
        pptx.layout = 'LAYOUT_16x9'
        pptx.author = 'Astri'
        pptx.title = 'Presentación'

        // Presentation dimensions in inches
        const slideWidth = 10
        const slideHeight = 5.625

        // Scale factors to convert from 1920x1080 pixels to inches
        const scaleX = slideWidth / 1920
        const scaleY = slideHeight / 1080

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
                        const fontSizePt = (obj.fontSize || 40) * scaleYObj * scaleY * 72

                        // Calculate height: use object height if available, otherwise calculate based on font size and text content
                        let textHeight: number | string = 'auto'
                        if (obj.height) {
                            // Use the actual height from the object
                            textHeight = obj.height * scaleYObj * scaleY
                        } else if (obj.text) {
                            // Calculate approximate height based on font size and line breaks
                            const textContent = obj.text || ''
                            const lineCount = textContent.split('\n').length
                            const fontSizeInches = (obj.fontSize || 40) * scaleYObj * scaleY
                            // Use line height of approximately 1.4 times font size
                            textHeight = fontSizeInches * lineCount * 1.4
                        }

                        const textOptions: any = {
                            x: (obj.left || 0) * scaleX,
                            y: (obj.top || 0) * scaleY,
                            w: obj.width ? obj.width * scaleXObj * scaleX : slideWidth * 0.8,
                            h: textHeight,
                            fontSize: fontSizePt,
                            color: (obj.fill || '#000000').replace('#', ''),
                            fontFace: obj.fontFamily || 'Arial',
                            bold: obj.fontWeight === 'bold',
                            italic: obj.fontStyle === 'italic',
                            align: obj.textAlign || 'left',
                            valign: 'top',
                        }

                        if (angle !== 0) {
                            textOptions.rotate = angle
                        }

                        slide.addText(obj.text || '', textOptions)
                        break

                    case 'rect':
                    case 'rectangle':
                        const rectOptions: any = {
                            x: (obj.left || 0) * scaleX,
                            y: (obj.top || 0) * scaleY,
                            w: (obj.width || 100) * scaleXObj * scaleX,
                            h: (obj.height || 100) * scaleYObj * scaleY,
                        }

                        if (obj.fill) {
                            rectOptions.fill = { color: obj.fill.replace('#', '') }
                        }

                        if (obj.stroke && obj.strokeWidth) {
                            rectOptions.line = {
                                color: obj.stroke.replace('#', ''),
                                width: (obj.strokeWidth || 1) * scaleX * 72 // Convert to points (1 inch = 72 points)
                            }
                        }

                        if (angle !== 0) {
                            rectOptions.rotate = angle
                        }

                        slide.addShape(pptx.ShapeType.rect, rectOptions)
                        break

                    case 'circle':
                        const diameter = (obj.radius || 50) * 2
                        const circleOptions: any = {
                            x: (obj.left || 0) * scaleX,
                            y: (obj.top || 0) * scaleY,
                            w: diameter * scaleXObj * scaleX,
                            h: diameter * scaleYObj * scaleY,
                        }

                        if (obj.fill) {
                            circleOptions.fill = { color: obj.fill.replace('#', '') }
                        }

                        if (obj.stroke && obj.strokeWidth) {
                            circleOptions.line = {
                                color: obj.stroke.replace('#', ''),
                                width: (obj.strokeWidth || 1) * scaleX * 72
                            }
                        }

                        if (angle !== 0) {
                            circleOptions.rotate = angle
                        }

                        slide.addShape(pptx.ShapeType.ellipse, circleOptions)
                        break

                    case 'triangle':
                        const triOptions: any = {
                            x: (obj.left || 0) * scaleX,
                            y: (obj.top || 0) * scaleY,
                            w: (obj.width || 100) * scaleXObj * scaleX,
                            h: (obj.height || 100) * scaleYObj * scaleY,
                        }

                        if (obj.fill) {
                            triOptions.fill = { color: obj.fill.replace('#', '') }
                        }

                        if (obj.stroke && obj.strokeWidth) {
                            triOptions.line = {
                                color: obj.stroke.replace('#', ''),
                                width: (obj.strokeWidth || 1) * scaleX * 72
                            }
                        }

                        if (angle !== 0) {
                            triOptions.rotate = angle
                        }

                        slide.addShape(pptx.ShapeType.triangle, triOptions)
                        break

                    case 'line':
                        const lineOptions: any = {
                            x: (obj.x1 || 0) * scaleX,
                            y: (obj.y1 || 0) * scaleY,
                            w: ((obj.x2 || 100) - (obj.x1 || 0)) * scaleX,
                            h: ((obj.y2 || 100) - (obj.y1 || 0)) * scaleY,
                            line: {
                                color: (obj.stroke || '#000000').replace('#', ''),
                                width: (obj.strokeWidth || 1) * scaleX * 72
                            }
                        }

                        slide.addShape(pptx.ShapeType.line, lineOptions)
                        break

                    case 'image':
                        if (obj.src) {
                            try {
                                // Calculate actual image dimensions from object properties
                                const imgW = (obj.width || 200) * scaleXObj * scaleX
                                const imgH = (obj.height || 200) * scaleYObj * scaleY

                                const imgOptions: any = {
                                    x: (obj.left || 0) * scaleX,
                                    y: (obj.top || 0) * scaleY,
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

                                if (angle !== 0) {
                                    imgOptions.rotate = angle
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
