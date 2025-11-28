import { jsPDF } from 'jspdf'
import { toast } from 'sonner'
import * as fabric from 'fabric'

/**
 * Load all fonts (Google Fonts and system fonts) dynamically
 */
async function ensureFontsLoaded(): Promise<void> {
    // Google Fonts that need to be explicitly loaded
    const googleFonts = [
        'Roboto',
        'Open Sans',
        'Montserrat',
        'Poppins',
        'Lato',
        'Inter',
        'Raleway'
    ]

    // System fonts that should already be available, but we'll load them to be sure
    const systemFonts = [
        'Arial',
        'Helvetica',
        'Verdana',
        'Tahoma',
        'Trebuchet MS',
        'Lucida Sans Unicode',
        'Impact',
        'Comic Sans MS',
        'Times New Roman',
        'Georgia',
        'Garamond',
        'Palatino Linotype',
        'Book Antiqua',
        'Courier New',
        'Consolas',
        'Monaco',
        'Lucida Console'
    ]

    const allFonts = [...googleFonts, ...systemFonts]

    if ('fonts' in document) {
        const fontPromises = allFonts.map(font =>
            document.fonts.load(`16px "${font}"`).catch(err => {
                console.warn(`⚠️ Font "${font}" could not be loaded:`, err)
                return null
            })
        )

        try {
            await Promise.all(fontPromises)
            console.log('✅ All fonts loaded for PDF export')
        } catch (error) {
            console.warn('⚠️ Some fonts failed to load:', error)
        }
    }
}

/**
 * Render slide using Fabric.js canvas (no HTML/CSS parsing = no oklch issues!)
 */
async function renderSlideToImage(slideData: any): Promise<string> {
    console.log('    🔧 [PDF-EXPORT-V4-FABRIC] renderSlideToImage iniciando...')
    console.log(`    🔧 [PDF-EXPORT-V4-FABRIC] slideData contiene ${slideData.objects?.length || 0} objetos`)

    // Create temporary canvas element
    const canvasElement = document.createElement('canvas')
    canvasElement.width = 1920
    canvasElement.height = 1080
    canvasElement.style.position = 'fixed'
    canvasElement.style.left = '-9999px'
    canvasElement.style.top = '0'
    document.body.appendChild(canvasElement)

    console.log('    🔧 [PDF-EXPORT-V4-FABRIC] Canvas element creado')

    try {
        // Create Fabric.js canvas
        const fabricCanvas = new fabric.Canvas(canvasElement, {
            width: 1920,
            height: 1080,
            backgroundColor: slideData.background || '#ffffff',
            renderOnAddRemove: false, // Performance optimization
        })

        console.log('    🔧 [PDF-EXPORT-V4-FABRIC] Fabric canvas creado')

        // Load slide objects
        if (!slideData.objects || slideData.objects.length === 0) {
            console.log('    ⚠️  Slide vacío, renderizando solo fondo...')
            fabricCanvas.renderAll()
            const imageData = fabricCanvas.toDataURL({ multiplier: 1, format: 'png', quality: 1.0 })
            console.log(`    ✅ [PDF-EXPORT-V4-FABRIC] PNG generado (${Math.round(imageData.length / 1024)}kb)`)
            return imageData
        }

        // Sort objects by zIndex
        const sortedObjects = [...slideData.objects].sort((a, b) => {
            const aIndex = a.zIndex !== undefined ? a.zIndex : 0
            const bIndex = b.zIndex !== undefined ? b.zIndex : 0
            return aIndex - bIndex
        })

        console.log(`    🔧 [PDF-EXPORT-V4-FABRIC] Cargando ${sortedObjects.length} objetos...`)

        // Load objects using Fabric.js enlivenObjects
        const loadPromises = sortedObjects.map(async (obj: any, index: number) => {
            try {
                const objType = (obj.type || '').toLowerCase()

                // Create Fabric object based on type
                let fabricObj: fabric.FabricObject | null = null

                switch (objType) {
                    case 'text':
                    case 'i-text':
                    case 'itext':
                    case 'textbox':
                        if (obj.width) {
                            fabricObj = new fabric.Textbox(obj.text || '', {
                                left: obj.left,
                                top: obj.top,
                                width: obj.width,
                                fontSize: obj.fontSize || 40,
                                fill: obj.fill || '#000000',
                                fontFamily: obj.fontFamily || 'Arial',
                                fontWeight: obj.fontWeight || 'normal',
                                fontStyle: obj.fontStyle || 'normal',
                                textAlign: obj.textAlign || 'left',
                                lineHeight: obj.lineHeight || 1.16,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                                opacity: obj.opacity ?? 1,
                            })
                        } else {
                            fabricObj = new fabric.IText(obj.text || '', {
                                left: obj.left,
                                top: obj.top,
                                fontSize: obj.fontSize || 40,
                                fill: obj.fill || '#000000',
                                fontFamily: obj.fontFamily || 'Arial',
                                fontWeight: obj.fontWeight || 'normal',
                                fontStyle: obj.fontStyle || 'normal',
                                textAlign: obj.textAlign || 'left',
                                lineHeight: obj.lineHeight || 1.16,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                                opacity: obj.opacity ?? 1,
                            })
                        }
                        break

                    case 'rect':
                    case 'rectangle':
                        fabricObj = new fabric.Rect({
                            left: obj.left,
                            top: obj.top,
                            width: obj.width || 100,
                            height: obj.height || 100,
                            fill: obj.fill || '#000000',
                            stroke: obj.stroke,
                            strokeWidth: obj.strokeWidth || 0,
                            rx: obj.rx || 0,
                            ry: obj.ry || 0,
                            angle: obj.angle || 0,
                            scaleX: obj.scaleX || 1,
                            scaleY: obj.scaleY || 1,
                            opacity: obj.opacity ?? 1,
                        })
                        break

                    case 'circle':
                        fabricObj = new fabric.Circle({
                            left: obj.left,
                            top: obj.top,
                            radius: obj.radius || 50,
                            fill: obj.fill || '#000000',
                            stroke: obj.stroke,
                            strokeWidth: obj.strokeWidth || 0,
                            angle: obj.angle || 0,
                            scaleX: obj.scaleX || 1,
                            scaleY: obj.scaleY || 1,
                            opacity: obj.opacity ?? 1,
                        })
                        break

                    case 'image':
                        if (obj.src) {
                            const img = await fabric.FabricImage.fromURL(obj.src, { crossOrigin: 'anonymous' })
                            if (obj.left !== undefined) img.set('left', obj.left)
                            if (obj.top !== undefined) img.set('top', obj.top)
                            if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
                            if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
                            if (obj.angle !== undefined) img.set('angle', obj.angle)
                            if (obj.originX !== undefined) img.set('originX', obj.originX)
                            if (obj.originY !== undefined) img.set('originY', obj.originY)
                            if (obj.width !== undefined) img.set('width', obj.width)
                            if (obj.height !== undefined) img.set('height', obj.height)
                            if (obj.opacity !== undefined) img.set('opacity', obj.opacity)
                            fabricObj = img
                        }
                        break

                    default:
                        console.warn(`      ⚠️  Tipo no soportado: ${obj.type}`)
                        return null
                }

                if (fabricObj) {
                    fabricObj.set({ selectable: false, evented: false })
                    console.log(`      ✅ Objeto ${index}: ${obj.type}`)
                    return fabricObj
                }
                return null
            } catch (error) {
                console.error(`      ❌ Error cargando objeto ${index}:`, error)
                return null
            }
        })

        // Wait for all objects to load
        const loadedObjects = await Promise.all(loadPromises)

        // Add objects to canvas
        loadedObjects.forEach((obj) => {
            if (obj) fabricCanvas.add(obj)
        })

        console.log(`    🔧 [PDF-EXPORT-V4-FABRIC] ${loadedObjects.filter(o => o).length} objetos cargados`)

        // Render canvas
        console.log('    🔧 [PDF-EXPORT-V4-FABRIC] Renderizando canvas...')
        fabricCanvas.renderAll()

        // Wait a bit for fonts to render
        await new Promise(resolve => setTimeout(resolve, 300))

        // Export to image
        console.log('    🔧 [PDF-EXPORT-V4-FABRIC] Exportando a PNG...')
        const imageData = fabricCanvas.toDataURL({ multiplier: 1, format: 'png', quality: 1.0 })
        console.log(`    ✅ [PDF-EXPORT-V4-FABRIC] PNG generado (${Math.round(imageData.length / 1024)}kb)`)

        return imageData

    } finally {
        // Clean up
        console.log('    🔧 [PDF-EXPORT-V4-FABRIC] Limpiando canvas...')
        if (canvasElement.parentNode === document.body) {
            document.body.removeChild(canvasElement)
            console.log('    ✅ [PDF-EXPORT-V4-FABRIC] Canvas removido del DOM')
        } else {
            console.log('    ℹ️  [PDF-EXPORT-V4-FABRIC] Canvas no estaba en el DOM')
        }
        console.log('    ✅ [PDF-EXPORT-V4-FABRIC] Limpieza completada')
    }
}

export async function exportToPDF(slides: any[]) {
    console.log('🚀 [PDF-EXPORT-V4-FABRIC] Exportación iniciada con', slides.length, 'slides')

    if (slides.length === 0) {
        toast.error('No slides to export')
        return
    }

    const loadingToast = toast.loading('Preparing slides for PDF export...')

    // Global console suppression for color function warnings
    const originalConsoleWarn = console.warn
    const colorWarningSuppress = (...args: any[]) => {
        const message = String(args[0] || '')
        if (message.includes('color function') ||
            message.includes('unsupported') ||
            message.includes('lab') ||
            message.includes('lch') ||
            message.includes('oklch')) {
            return // Suppress
        }
        originalConsoleWarn.apply(console, args)
    }
    console.warn = colorWarningSuppress

    try {
        console.log('📥 [PDF-EXPORT-V4-FABRIC] Cargando fuentes...')
        // Ensure all Google Fonts are loaded
        await ensureFontsLoaded()
        console.log('✅ [PDF-EXPORT-V4-FABRIC] Fuentes cargadas')

        // Create PDF with 16:9 aspect ratio (matching slide dimensions)
        const slideAspectRatio = 16 / 9
        const pageWidth = 297 // mm
        const pageHeight = pageWidth / slideAspectRatio // Calculate height to maintain 16:9

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [pageHeight, pageWidth] // [height, width] for landscape
        })

        // Process each slide
        console.log('📝 [PDF-EXPORT-V4-FABRIC] Iniciando procesamiento de slides...')
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i]
            console.log(`\n🎨 [PDF-EXPORT-V4-FABRIC] ========== SLIDE ${i + 1}/${slides.length} ==========`)

            // Update loading message
            toast.loading(`Rendering slide ${i + 1} of ${slides.length}...`, { id: loadingToast })

            try {
                // Render slide to image
                console.log(`  📸 [PDF-EXPORT-V4-FABRIC] Renderizando slide ${i + 1}...`)
                const imageData = await renderSlideToImage(slide)
                console.log(`  ✅ [PDF-EXPORT-V4-FABRIC] Slide ${i + 1} renderizado (${Math.round(imageData.length / 1024)}kb)`)

                // Add page if not first slide
                if (i > 0) {
                    pdf.addPage()
                    console.log(`  📄 [PDF-EXPORT-V4-FABRIC] Nueva página agregada`)
                }

                // Add image to PDF
                console.log(`  📄 [PDF-EXPORT-V4-FABRIC] Insertando imagen en PDF...`)
                pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')

                console.log(`✅ [PDF-EXPORT-V4-FABRIC] Slide ${i + 1} completado`)
            } catch (slideError) {
                console.error(`❌ [PDF-EXPORT-V4-FABRIC] Error en slide ${i + 1}:`, slideError)
                throw slideError
            }
        }

        // Save PDF
        console.log('\n💾 [PDF-EXPORT-V4-FABRIC] Guardando archivo PDF...')
        pdf.save('presentacion.pdf')
        console.log('✅ [PDF-EXPORT-V4-FABRIC] Archivo guardado: presentacion.pdf')

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success('PDF exported successfully with original fonts!')
        console.log('🎉 [PDF-EXPORT-V4-FABRIC] ¡Exportación completada exitosamente!')
    } catch (error) {
        console.error('❌ [PDF-EXPORT-V4-FABRIC] Error fatal:', error)
        toast.dismiss(loadingToast)
        toast.error('Error exporting to PDF')
    } finally {
        // Restore original console.warn
        console.warn = originalConsoleWarn
        console.log('🔄 [PDF-EXPORT-V4-FABRIC] Console restaurado, proceso finalizado')
    }
}
