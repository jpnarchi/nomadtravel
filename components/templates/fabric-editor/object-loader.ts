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
            default:
                console.warn(`⚠️ Tipo de objeto desconocido: ${obj.type} (normalizado: ${objType})`)
                return null
        }

        if (fabricObj) {
            applyCommonProperties(fabricObj, obj)
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
    console.log(`🖼️ Creando imagen desde: ${obj.src}`)

    if (!obj.src) return null

    try {
        const img = await fabric.FabricImage.fromURL(obj.src)

        if (obj.left !== undefined) img.set('left', obj.left)
        if (obj.top !== undefined) img.set('top', obj.top)
        if (obj.scaleX !== undefined) img.set('scaleX', obj.scaleX)
        if (obj.scaleY !== undefined) img.set('scaleY', obj.scaleY)
        if (obj.angle !== undefined) img.set('angle', obj.angle)

        console.log(`✅ Imagen ${index} cargada`)
        return img
    } catch (err) {
        console.error(`❌ Error cargando imagen ${index}:`, err)
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
            console.log(`✅ Objeto ${index} agregado al canvas en orden`)
        }
    })

    canvas.renderAll()
    console.log(`✅ Slide ${slideNumber} cargado completamente con ${canvas.getObjects().length} objetos en el orden correcto`)
}
