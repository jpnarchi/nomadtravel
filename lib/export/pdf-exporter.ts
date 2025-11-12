import { jsPDF } from 'jspdf'
import { toast } from 'sonner'

export async function exportToPDF(slides: any[]) {
    if (slides.length === 0) {
        toast.error('No slides to export')
        return
    }

    const loadingToast = toast.loading('Downloading PDF...')

    try {
        // Create PDF with 16:9 aspect ratio (matching slide dimensions)
        const slideAspectRatio = 16 / 9
        const pageWidth = 297 // mm
        const pageHeight = pageWidth / slideAspectRatio // Calculate height to maintain 16:9

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [pageHeight, pageWidth] // [height, width] for landscape
        })

        // Scale factor to convert from 1920x1080 pixels to PDF dimensions (mm)
        const scaleX = pageWidth / 1920
        const scaleY = pageHeight / 1080

        // Export each slide
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i]

            // Add page if not first slide
            if (i > 0) {
                pdf.addPage()
            }

            // Set background color
            if (slide.background) {
                pdf.setFillColor(slide.background)
                pdf.rect(0, 0, pageWidth, pageHeight, 'F')
            }

            // Sort objects by zIndex
            const sortedObjects = [...(slide.objects || [])].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            // Process each object
            for (const obj of sortedObjects) {
                const objType = (obj.type || '').toLowerCase()
                const scaleXObj = obj.scaleX || 1
                const scaleYObj = obj.scaleY || 1

                switch (objType) {
                    case 'text':
                    case 'i-text':
                    case 'itext':
                    case 'textbox':
                        // Add text as actual text (selectable)
                        // Font size in PDF is in points (pt). 1 pt ≈ 0.3528 mm
                        const fontSizePt = (obj.fontSize || 40) * scaleYObj * scaleY / 0.3528
                        pdf.setFontSize(fontSizePt)
                        pdf.setTextColor(obj.fill || '#000000')

                        // Set font style
                        const fontWeight = obj.fontWeight === 'bold' ? 'bold' : 'normal'
                        const fontStyle = obj.fontStyle === 'italic' ? 'italic' : 'normal'
                        pdf.setFont('helvetica', fontStyle === 'italic' && fontWeight === 'bold' ? 'bolditalic' : fontWeight === 'bold' ? 'bold' : fontStyle === 'italic' ? 'italic' : 'normal')

                        const textX = (obj.left || 0) * scaleX
                        const textY = (obj.top || 0) * scaleY + fontSizePt * 0.3528 * 0.85 // Adjust baseline

                        // Handle text alignment
                        const align = obj.textAlign || 'left'
                        pdf.text(obj.text || '', textX, textY, {
                            align: align as 'left' | 'center' | 'right',
                            maxWidth: obj.width ? obj.width * scaleXObj * scaleX : undefined
                        })
                        break

                    case 'rect':
                    case 'rectangle':
                        const rectX = (obj.left || 0) * scaleX
                        const rectY = (obj.top || 0) * scaleY
                        const rectW = (obj.width || 100) * scaleXObj * scaleX
                        const rectH = (obj.height || 100) * scaleYObj * scaleY

                        // Fill
                        if (obj.fill) {
                            pdf.setFillColor(obj.fill)
                            pdf.roundedRect(rectX, rectY, rectW, rectH, (obj.rx || 0) * scaleX, (obj.ry || 0) * scaleY, 'F')
                        }

                        // Stroke
                        if (obj.stroke && obj.strokeWidth) {
                            pdf.setDrawColor(obj.stroke)
                            pdf.setLineWidth((obj.strokeWidth || 0) * scaleX)
                            pdf.roundedRect(rectX, rectY, rectW, rectH, (obj.rx || 0) * scaleX, (obj.ry || 0) * scaleY, 'S')
                        }
                        break

                    case 'circle':
                        const circleX = (obj.left || 0) * scaleX + (obj.radius || 50) * scaleXObj * scaleX
                        const circleY = (obj.top || 0) * scaleY + (obj.radius || 50) * scaleYObj * scaleY
                        const radius = (obj.radius || 50) * Math.min(scaleXObj, scaleYObj) * scaleX

                        if (obj.fill) {
                            pdf.setFillColor(obj.fill)
                            pdf.circle(circleX, circleY, radius, 'F')
                        }

                        if (obj.stroke && obj.strokeWidth) {
                            pdf.setDrawColor(obj.stroke)
                            pdf.setLineWidth((obj.strokeWidth || 0) * scaleX)
                            pdf.circle(circleX, circleY, radius, 'S')
                        }
                        break

                    case 'triangle':
                        const triX = (obj.left || 0) * scaleX
                        const triY = (obj.top || 0) * scaleY
                        const triW = (obj.width || 100) * scaleXObj * scaleX
                        const triH = (obj.height || 100) * scaleYObj * scaleY

                        if (obj.fill) {
                            pdf.setFillColor(obj.fill)
                        }

                        pdf.triangle(triX + triW / 2, triY, triX, triY + triH, triX + triW, triY + triH, obj.fill ? 'F' : 'S')
                        break

                    case 'line':
                        const x1 = (obj.x1 || 0) * scaleX
                        const y1 = (obj.y1 || 0) * scaleY
                        const x2 = (obj.x2 || 100) * scaleX
                        const y2 = (obj.y2 || 100) * scaleY

                        pdf.setDrawColor(obj.stroke || '#000000')
                        pdf.setLineWidth((obj.strokeWidth || 1) * scaleX)
                        pdf.line(x1, y1, x2, y2)
                        break

                    case 'image':
                        if (obj.src) {
                            try {
                                // Calculate actual image dimensions from object properties
                                const imgW = (obj.width || 200) * scaleXObj * scaleX
                                const imgH = (obj.height || 200) * scaleYObj * scaleY

                                // CRITICAL: Convert from Fabric.js coordinates to PDF coordinates
                                // Fabric.js images can have origin at 'center', but PDF always uses top-left
                                let imgX = (obj.left || 0) * scaleX
                                let imgY = (obj.top || 0) * scaleY

                                // If image has center origin, convert to top-left origin for PDF
                                if (obj.originX === 'center') {
                                    imgX = imgX - (imgW / 2)
                                }
                                if (obj.originY === 'center') {
                                    imgY = imgY - (imgH / 2)
                                }

                                pdf.addImage(obj.src, 'PNG', imgX, imgY, imgW, imgH)
                            } catch (err) {
                                console.error('Error adding image to PDF:', err)
                            }
                        }
                        break
                }
            }
        }

        // Save PDF
        pdf.save('presentacion.pdf')

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success('PDF exported successfully')
    } catch (error) {
        console.error('Error exporting to PDF:', error)
        toast.dismiss(loadingToast)
        toast.error('Error exporting to PDF')
    }
}
