/**
 * Object Loader - Carga objetos de Fabric.js desde JSON
 */

import * as fabric from 'fabric'

/**
 * Crea un objeto de Fabric desde su representación JSON
 */
export const createFabricObjectFromJSON = async (obj: any, index: number): Promise<fabric.FabricObject | null> => {
    console.log(`🔍 Procesando objeto ${index}:`, obj)

    try {
        const objType = (obj.type || '').toLowerCase()
        let fabricObj: fabric.FabricObject | null = null

        switch (objType) {
            case 'text':
            case 'i-text':
            case 'itext':
            case 'textbox':
                fabricObj = createTextObject(obj)
                break
            case 'rect':
            case 'rectangle':
                fabricObj = createRectObject(obj)
                break
            case 'circle':
                fabricObj = createCircleObject(obj)
                break
            case 'triangle':
                fabricObj = createTriangleObject(obj)
                break
            case 'line':
                fabricObj = createLineObject(obj)
                break
            case 'image':
                fabricObj = await createImageObject(obj, index)
                break
            case 'group':
                fabricObj = await createGroupObject(obj, index)
                break
            default:
                console.warn(`⚠️ Tipo de objeto desconocido: ${obj.type} (normalizado: ${objType})`)
                return null
        }

        if (fabricObj) {
            applyCommonProperties(fabricObj, obj)

            // Restore custom properties for image placeholders and containers
            if (obj.isImagePlaceholder) {
                ;(fabricObj as any).isImagePlaceholder = true
                ;(fabricObj as any).placeholderWidth = obj.placeholderWidth
                ;(fabricObj as any).placeholderHeight = obj.placeholderHeight
                ;(fabricObj as any).borderRadius = obj.borderRadius || 0
                console.log(`📦 Restaurado contenedor de imagen con borderRadius: ${obj.borderRadius}`)
            }

            if (obj.isImageContainer) {
                ;(fabricObj as any).isImageContainer = true
                ;(fabricObj as any).borderRadius = obj.borderRadius || 0
                console.log(`🖼️ Restaurado imagen con container, borderRadius: ${obj.borderRadius}`)
            }

            console.log(`✅ Objeto ${index} creado: ${obj.type} en (${obj.left}, ${obj.top})`,
                obj.lockMovementX ? '🔒 bloqueado' : '')
        }

        return fabricObj
    } catch (error) {
        console.error(`❌ Error al crear objeto ${index}:`, error, obj)
        return null
    }
}

/**
 * Crea un objeto de texto desde JSON
 */
const createTextObject = (obj: any): fabric.FabricObject => {
    console.log(`📝 Creando texto: "${obj.text}"`)

    // Use Textbox if width is defined, otherwise use IText for backward compatibility
    if (obj.width) {
        const textbox = new fabric.Textbox(obj.text || 'Text', {
            left: obj.left,
            top: obj.top,
            width: obj.width,
            fontSize: obj.fontSize || 40,
            fill: obj.fill || '#000000',
            fontFamily: obj.fontFamily || 'Arial',
            fontWeight: obj.fontWeight || 'normal',
            textAlign: obj.textAlign || 'left',
            lineHeight: obj.lineHeight || 1.16,
        })

        // Apply additional properties
        if (obj.originX) textbox.set('originX', obj.originX)
        if (obj.originY) textbox.set('originY', obj.originY)
        if (obj.angle !== undefined) textbox.set('angle', obj.angle)
        if (obj.scaleX !== undefined) textbox.set('scaleX', obj.scaleX)
        if (obj.scaleY !== undefined) textbox.set('scaleY', obj.scaleY)

        return textbox
    } else {
        const itext = new fabric.IText(obj.text || 'Text', {
            left: obj.left,
            top: obj.top,
            fontSize: obj.fontSize || 40,
            fill: obj.fill || '#000000',
            fontFamily: obj.fontFamily || 'Arial',
            fontWeight: obj.fontWeight || 'normal',
            textAlign: obj.textAlign || 'left',
            lineHeight: obj.lineHeight || 1.16,
        })

        // Apply additional properties
        if (obj.originX) itext.set('originX', obj.originX)
        if (obj.originY) itext.set('originY', obj.originY)
        if (obj.angle !== undefined) itext.set('angle', obj.angle)
        if (obj.scaleX !== undefined) itext.set('scaleX', obj.scaleX)
        if (obj.scaleY !== undefined) itext.set('scaleY', obj.scaleY)

        return itext
    }
}

/**
 * Crea un rectángulo desde JSON
 */
const createRectObject = (obj: any): fabric.Rect => {
    console.log(`📦 Creando rectángulo`)

    return new fabric.Rect({
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
}

/**
 * Crea un círculo desde JSON
 */
const createCircleObject = (obj: any): fabric.Circle => {
    console.log(`⭕ Creando círculo`)

    return new fabric.Circle({
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
}

/**
 * Crea un triángulo desde JSON
 */
const createTriangleObject = (obj: any): fabric.Triangle => {
    console.log(`🔺 Creando triángulo`)

    return new fabric.Triangle({
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
}

/**
 * Crea una línea desde JSON
 */
const createLineObject = (obj: any): fabric.Line => {
    console.log(`📏 Creando línea`)

    return new fabric.Line([obj.x1 || 0, obj.y1 || 0, obj.x2 || 100, obj.y2 || 100], {
        stroke: obj.stroke || '#000000',
        strokeWidth: obj.strokeWidth || 1,
    })
}

/**
 * Crea una imagen desde JSON
 */
const createImageObject = async (obj: any, index: number): Promise<fabric.FabricImage | null> => {
    console.log(`🖼️ Creando imagen ${index} desde JSON:`, {
        src: obj.src?.substring(0, 50) + '...',
        position: { left: obj.left, top: obj.top },
        origin: { originX: obj.originX, originY: obj.originY },
        scale: { scaleX: obj.scaleX, scaleY: obj.scaleY },
        size: { width: obj.width, height: obj.height },
        crop: { cropX: obj.cropX, cropY: obj.cropY },
        angle: obj.angle,
        isImageContainer: obj.isImageContainer,
        borderRadius: obj.borderRadius
    })

    if (!obj.src) return null

    try {
        const img = await fabric.FabricImage.fromURL(obj.src)

        if (obj.left !== undefined) img.set('left', obj.left)
        if (obj.top !== undefined) img.set('top', obj.top)
        if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
        if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
        if (obj.angle !== undefined) img.set('angle', obj.angle)
        if (obj.originX !== undefined) img.set('originX', obj.originX)
        if (obj.originY !== undefined) img.set('originY', obj.originY)

        // Restore crop properties for image containers
        if (obj.cropX !== undefined) (img as any).cropX = obj.cropX
        if (obj.cropY !== undefined) (img as any).cropY = obj.cropY
        if (obj.width !== undefined) img.set('width', obj.width)
        if (obj.height !== undefined) img.set('height', obj.height)

        // Restore clipPath if it exists
        if (obj.clipPath && obj.borderRadius) {
            const clipBorderRadius = obj.borderRadius / (obj.scaleX || 1)
            const clipPath = new fabric.Rect({
                width: obj.width,
                height: obj.height,
                rx: clipBorderRadius,
                ry: clipBorderRadius,
                left: -(obj.width) / 2,
                top: -(obj.height) / 2,
                originX: 'left',
                originY: 'top',
            })
            img.set('clipPath', clipPath)
        }

        console.log(`✅ Imagen ${index} cargada con valores finales:`, {
            position: { left: img.left, top: img.top },
            origin: { originX: img.originX, originY: img.originY },
            scale: { scaleX: img.scaleX, scaleY: img.scaleY },
            size: { width: img.width, height: img.height },
            angle: img.angle
        })
        return img
    } catch (err) {
        console.error(`❌ Error cargando imagen ${index}:`, err)
        return null
    }
}

/**
 * Crea un grupo desde JSON (para image placeholders)
 */
const createGroupObject = async (obj: any, index: number): Promise<fabric.Group | null> => {
    console.log(`📦 Creando grupo (probablemente un contenedor de imagen)`)

    try {
        // Use Fabric.js built-in method to recreate the group from JSON
        const group = await fabric.Group.fromObject(obj)

        // IMPORTANT: Immediately restore custom properties on the group
        // This ensures they're available before the group is returned
        if (obj.isImagePlaceholder) {
            ;(group as any).isImagePlaceholder = true
            ;(group as any).placeholderWidth = obj.placeholderWidth
            ;(group as any).placeholderHeight = obj.placeholderHeight
            ;(group as any).borderRadius = obj.borderRadius || 0
            console.log(`📦 Propiedades custom aplicadas inmediatamente en grupo:`, {
                isImagePlaceholder: true,
                placeholderWidth: obj.placeholderWidth,
                placeholderHeight: obj.placeholderHeight,
                borderRadius: obj.borderRadius
            })
        }

        console.log(`✅ Grupo ${index} creado con propiedades:`, {
            type: group.type,
            isImagePlaceholder: (group as any).isImagePlaceholder,
            placeholderWidth: (group as any).placeholderWidth,
            borderRadius: (group as any).borderRadius
        })
        return group
    } catch (err) {
        console.error(`❌ Error cargando grupo ${index}:`, err)
        return null
    }
}

/**
 * Aplica propiedades comunes a un objeto de Fabric
 */
const applyCommonProperties = (fabricObj: fabric.FabricObject, obj: any) => {
    fabricObj.set({
        selectable: obj.lockMovementX ? true : true,
        evented: obj.lockMovementX ? true : true,
        hasControls: obj.lockMovementX ? false : true,
        hasBorders: true,
        lockScalingFlip: true,
        lockMovementX: obj.lockMovementX || false,
        lockMovementY: obj.lockMovementY || false,
        lockRotation: obj.lockRotation || false,
        lockScalingX: obj.lockScalingX || false,
        lockScalingY: obj.lockScalingY || false,
        opacity: obj.opacity ?? 1,
    })
}

/**
 * Carga todos los objetos en el canvas
 */
export const loadObjectsToCanvas = async (canvas: fabric.Canvas, slideData: any, slideNumber: number) => {
    if (!slideData || !slideData.objects || !Array.isArray(slideData.objects)) {
        console.log(`📭 Slide ${slideNumber} está vacío (sin objetos)`)
        return
    }

    console.log(`📥 Cargando ${slideData.objects.length} objetos en el slide ${slideNumber}`)
    console.log(`📋 Datos de slideData:`, slideData)

    // Sort objects by zIndex to preserve layer order
    const sortedObjects = [...slideData.objects].sort((a, b) => {
        const aIndex = a.zIndex !== undefined ? a.zIndex : 0
        const bIndex = b.zIndex !== undefined ? b.zIndex : 0
        return aIndex - bIndex
    })

    console.log(`🔢 Objetos ordenados por zIndex:`, sortedObjects.map((obj, i) => ({
        type: obj.type,
        zIndex: obj.zIndex,
        position: i
    })))

    // Load all objects asynchronously to preserve layer order
    const objectPromises = sortedObjects.map((obj: any, index: number) =>
        createFabricObjectFromJSON(obj, index)
    )

    // Wait for all objects to be created
    const loadedObjects = await Promise.all(objectPromises)

    // Add objects to canvas in the correct order
    loadedObjects.forEach((fabricObj, index) => {
        if (fabricObj) {
            canvas.add(fabricObj)

            // Verify custom properties are still present after adding to canvas
            if ((fabricObj as any).isImagePlaceholder) {
                console.log(`✅ Objeto ${index} agregado al canvas - PLACEHOLDER con propiedades:`, {
                    type: fabricObj.type,
                    isImagePlaceholder: (fabricObj as any).isImagePlaceholder,
                    placeholderWidth: (fabricObj as any).placeholderWidth,
                    placeholderHeight: (fabricObj as any).placeholderHeight,
                    borderRadius: (fabricObj as any).borderRadius
                })
            } else if ((fabricObj as any).isImageContainer) {
                console.log(`✅ Objeto ${index} agregado al canvas - IMAGE CONTAINER con propiedades:`, {
                    type: fabricObj.type,
                    isImageContainer: (fabricObj as any).isImageContainer,
                    borderRadius: (fabricObj as any).borderRadius
                })
            } else {
                console.log(`✅ Objeto ${index} agregado al canvas en orden`)
            }
        }
    })

    canvas.renderAll()
    console.log(`✅ Slide ${slideNumber} cargado completamente con ${canvas.getObjects().length} objetos en el orden correcto`)
}
