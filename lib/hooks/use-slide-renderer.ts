import { useEffect } from 'react'
import * as fabric from 'fabric'

export function useSlideRenderer(
    canvasReady: boolean,
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>,
    slides: any[],
    currentSlide: number
) {
    useEffect(() => {
        if (!canvasReady || !fabricCanvasRef.current || slides.length === 0) {
            console.log('❌ Esperando...', {
                canvasReady,
                canvas: !!fabricCanvasRef.current,
                slidesLength: slides.length
            })
            return
        }

        const canvas = fabricCanvasRef.current
        const slide = slides[currentSlide]

        console.log(`🎨 Renderizando slide ${currentSlide + 1}:`, slide)

        if (!slide) {
            console.log('❌ Slide no encontrado')
            return
        }

        // Clear canvas
        canvas.clear()
        console.log('🧹 Canvas limpiado')

        // Set background
        if (slide.background) {
            canvas.backgroundColor = slide.background
            console.log('🎨 Background configurado:', slide.background)
        }

        // Load objects from JSON asynchronously
        const loadSlideObjects = async () => {
            if (!slide.objects || !Array.isArray(slide.objects)) {
                canvas.renderAll()
                return
            }

            // Sort objects by zIndex to preserve layer order
            const sortedObjects = [...slide.objects].sort((a, b) => {
                const aIndex = a.zIndex !== undefined ? a.zIndex : 0
                const bIndex = b.zIndex !== undefined ? b.zIndex : 0
                return aIndex - bIndex
            })

            console.log(`📦 Cargando ${sortedObjects.length} objetos en orden`)
            console.log(`🔢 Objetos ordenados por zIndex:`, sortedObjects.map((obj, i) => ({
                type: obj.type,
                zIndex: obj.zIndex,
                position: i
            })))

            // Create promises for all objects
            const objectPromises = sortedObjects.map(async (obj: any, index: number) => {
                console.log(`🔸 Objeto ${index}:`, obj.type, obj)
                try {
                    // Normalize type to lowercase for comparison
                    const objType = (obj.type || '').toLowerCase()

                    let fabricObj: fabric.FabricObject | null = null

                    switch (objType) {
                        case 'text':
                        case 'i-text':
                        case 'itext':
                        case 'textbox':
                            console.log(`📝 Creando texto: "${obj.text}"`)
                            if (obj.width) {
                                fabricObj = new fabric.Textbox(obj.text || 'Text', {
                                    left: obj.left,
                                    top: obj.top,
                                    width: obj.width,
                                    fontSize: obj.fontSize || 40,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    fontStyle: obj.fontStyle || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                    lineHeight: obj.lineHeight,
                                    charSpacing: obj.charSpacing,
                                    originX: obj.originX,
                                    originY: obj.originY,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                })
                            } else {
                                fabricObj = new fabric.IText(obj.text || 'Text', {
                                    left: obj.left,
                                    top: obj.top,
                                    fontSize: obj.fontSize || 40,
                                    fill: obj.fill || '#000000',
                                    fontFamily: obj.fontFamily || 'Arial',
                                    fontWeight: obj.fontWeight || 'normal',
                                    fontStyle: obj.fontStyle || 'normal',
                                    textAlign: obj.textAlign || 'left',
                                    lineHeight: obj.lineHeight,
                                    charSpacing: obj.charSpacing,
                                    originX: obj.originX,
                                    originY: obj.originY,
                                    angle: obj.angle || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                })
                            }
                            break
                        case 'rect':
                        case 'rectangle':
                            console.log(`📦 Creando rectángulo`)
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
                            })
                            break
                        case 'circle':
                            console.log(`⭕ Creando círculo`)
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
                            })
                            break
                        case 'triangle':
                            console.log(`🔺 Creando triángulo`)
                            fabricObj = new fabric.Triangle({
                                left: obj.left,
                                top: obj.top,
                                width: obj.width || 100,
                                height: obj.height || 100,
                                fill: obj.fill || '#000000',
                                stroke: obj.stroke,
                                strokeWidth: obj.strokeWidth || 0,
                                angle: obj.angle || 0,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                            })
                            break
                        case 'line':
                            console.log(`📏 Creando línea`)
                            fabricObj = new fabric.Line([obj.x1 || 0, obj.y1 || 0, obj.x2 || 100, obj.y2 || 100], {
                                stroke: obj.stroke || '#000000',
                                strokeWidth: obj.strokeWidth || 1,
                            })
                            break
                        case 'image':
                            console.log(`🖼️ Creando imagen desde: ${obj.src}`)
                            if (obj.src) {
                                try {
                                    const img = await fabric.FabricImage.fromURL(obj.src, { crossOrigin: 'anonymous' })
                                    if (obj.left !== undefined) img.set('left', obj.left)
                                    if (obj.top !== undefined) img.set('top', obj.top)
                                    if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
                                    if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
                                    if (obj.angle !== undefined) img.set('angle', obj.angle)
                                    img.set({ selectable: false, evented: false })
                                    fabricObj = img
                                    console.log(`✅ Imagen ${index} cargada`)
                                } catch (err) {
                                    console.error('Error loading image:', err)
                                    return null
                                }
                            }
                            break
                        default:
                            console.warn(`Unknown object type: ${obj.type} (normalized: ${objType})`)
                            return null
                    }

                    if (fabricObj) {
                        fabricObj.set({
                            selectable: false,
                            evented: false,
                            opacity: obj.opacity ?? 1,
                        })
                        console.log(`✅ Objeto ${index} creado`)
                        return fabricObj
                    }
                    return null
                } catch (error) {
                    console.error('❌ Error creating fabric object:', error, obj)
                    return null
                }
            })

            // Wait for all objects to load
            const loadedObjects = await Promise.all(objectPromises)

            // Add all loaded objects to canvas
            loadedObjects.forEach((obj, index) => {
                if (obj) {
                    canvas.add(obj)
                    console.log(`✅ Objeto ${index} agregado al canvas`)
                }
            })

            console.log('🎨 Renderizando canvas...')
            canvas.renderAll()
            console.log('✅ Canvas renderizado. Objetos en canvas:', canvas.getObjects().length)
        }

        // Execute async loading
        loadSlideObjects()
    }, [currentSlide, slides, canvasReady, fabricCanvasRef])
}
