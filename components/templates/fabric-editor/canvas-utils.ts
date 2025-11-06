/**
 * Canvas Utils - Utilidades para operaciones con el canvas de Fabric.js
 */

import * as fabric from 'fabric'

/**
 * Serializa el canvas a JSON
 */
export const serializeCanvas = (canvas: fabric.Canvas, backgroundColor: string) => {
    const objects = canvas.getObjects().map((obj, index) => {
        // Include all necessary properties for serialization
        // @ts-expect-error - fabric.js toJSON accepts propertiesToInclude array
        const json = obj.toJSON([
            'selectable',
            'evented',
            'hasControls',
            'hasBorders',
            'lockScalingFlip',
            'crossOrigin',
            'lockMovementX',
            'lockMovementY',
            'lockRotation',
            'lockScalingX',
            'lockScalingY',
            'opacity',
            // Text-specific properties
            'text',
            'fontSize',
            'fontFamily',
            'fontWeight',
            'fontStyle',
            'textAlign',
            'lineHeight',
            'charSpacing',
            'styles',
            'editable',
            'width' // Include width for Textbox objects (text wrapping)
        ])

        // Add z-index to preserve layer order
        json.zIndex = index

        // Log text objects specifically
        if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
            console.log('📝 Serializando texto:', {
                type: obj.type,
                text: (obj as any).text,
                fontSize: (obj as any).fontSize,
                zIndex: index,
                json: json
            })
        }

        return json
    })

    return {
        version: '5.3.0',
        objects: objects,
        background: backgroundColor
    }
}

/**
 * Copia un objeto de Fabric a JSON
 */
export const copyObjectToJSON = (obj: fabric.FabricObject) => {
    // @ts-expect-error - fabric.js toJSON accepts propertiesToInclude array
    const objectData = obj.toJSON([
        'selectable', 'evented', 'hasControls', 'hasBorders',
        'lockScalingFlip', 'crossOrigin',
        'lockMovementX', 'lockMovementY', 'lockRotation',
        'lockScalingX', 'lockScalingY', 'opacity',
        'text', 'fontSize', 'fontFamily', 'fontWeight',
        'fontStyle', 'textAlign', 'lineHeight',
        'charSpacing', 'styles', 'editable', 'width'
    ])

    console.log('📋 Objeto copiado:', objectData)
    return objectData
}

/**
 * Pega un objeto desde JSON en el canvas
 */
export const pasteObjectFromJSON = async (canvas: fabric.Canvas, objData: any): Promise<fabric.FabricObject | null> => {
    const objType = (objData.type || '').toLowerCase()

    console.log('📋 Pegando objeto tipo:', objType, objData)

    let newObj: fabric.FabricObject | null = null

    try {
        switch (objType) {
            case 'text':
            case 'i-text':
            case 'itext':
            case 'textbox':
                // Use Textbox if width is defined, otherwise use IText
                if (objData.width) {
                    newObj = new fabric.Textbox(objData.text || 'Text', {
                        left: objData.left + 20,
                        top: objData.top + 20,
                        width: objData.width,
                        fontSize: objData.fontSize,
                        fill: objData.fill,
                        fontFamily: objData.fontFamily,
                        fontWeight: objData.fontWeight,
                        fontStyle: objData.fontStyle,
                        textAlign: objData.textAlign,
                        lineHeight: objData.lineHeight,
                        charSpacing: objData.charSpacing,
                        angle: objData.angle || 0,
                        scaleX: objData.scaleX || 1,
                        scaleY: objData.scaleY || 1,
                        originX: objData.originX,
                        originY: objData.originY,
                    })
                } else {
                    newObj = new fabric.IText(objData.text || 'Text', {
                        left: objData.left + 20,
                        top: objData.top + 20,
                        fontSize: objData.fontSize,
                        fill: objData.fill,
                        fontFamily: objData.fontFamily,
                        fontWeight: objData.fontWeight,
                        fontStyle: objData.fontStyle,
                        textAlign: objData.textAlign,
                        lineHeight: objData.lineHeight,
                        charSpacing: objData.charSpacing,
                        angle: objData.angle || 0,
                        scaleX: objData.scaleX || 1,
                        scaleY: objData.scaleY || 1,
                        originX: objData.originX,
                        originY: objData.originY,
                    })
                }
                break
            case 'rect':
            case 'rectangle':
                newObj = new fabric.Rect({
                    left: objData.left + 20,
                    top: objData.top + 20,
                    width: objData.width,
                    height: objData.height,
                    fill: objData.fill,
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                    rx: objData.rx,
                    ry: objData.ry,
                    angle: objData.angle,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                })
                break
            case 'circle':
                newObj = new fabric.Circle({
                    left: objData.left + 20,
                    top: objData.top + 20,
                    radius: objData.radius,
                    fill: objData.fill,
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                    angle: objData.angle,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                })
                break
            case 'triangle':
                newObj = new fabric.Triangle({
                    left: objData.left + 20,
                    top: objData.top + 20,
                    width: objData.width,
                    height: objData.height,
                    fill: objData.fill,
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                    angle: objData.angle,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                })
                break
            case 'line':
                newObj = new fabric.Line([objData.x1, objData.y1, objData.x2, objData.y2], {
                    left: objData.left + 20,
                    top: objData.top + 20,
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                })
                break
            case 'image':
                if (objData.src) {
                    const img = await fabric.FabricImage.fromURL(objData.src)
                    img.set({
                        left: objData.left + 20,
                        top: objData.top + 20,
                        scaleX: objData.scaleX,
                        scaleY: objData.scaleY,
                        angle: objData.angle,
                    })
                    newObj = img
                }
                break
            default:
                console.warn('⚠️ Tipo de objeto no soportado para pegar:', objType)
                return null
        }

        if (newObj) {
            // Apply common properties
            newObj.set({
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true,
                opacity: objData.opacity ?? 1,
            })

            canvas.add(newObj)
            canvas.setActiveObject(newObj)
            canvas.renderAll()

            console.log('✅ Objeto pegado')
        }

        return newObj
    } catch (error) {
        console.error('❌ Error al pegar objeto:', error)
        throw error
    }
}

/**
 * Actualiza una propiedad de un objeto de texto
 */
export const updateObjectProperty = (
    obj: fabric.FabricObject,
    property: string,
    value: any,
    canvas: fabric.Canvas
) => {
    obj.set(property as any, value)
    canvas.renderAll()
}

/**
 * Actualiza el color de relleno de un objeto
 */
export const updateObjectFillColor = (
    obj: fabric.FabricObject,
    color: string,
    canvas: fabric.Canvas
) => {
    obj.set('fill', color)
    canvas.renderAll()
}

/**
 * Bloquea/desbloquea un objeto
 */
export const toggleObjectLock = (obj: fabric.FabricObject, canvas: fabric.Canvas) => {
    const isLocked = obj.lockMovementX || obj.lockMovementY

    if (isLocked) {
        // Unlock object
        obj.set({
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })
        return false
    } else {
        // Lock object
        obj.set({
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            hasControls: false,
        })
        return true
    }
}

/**
 * Layer controls
 */
export const bringObjectToFront = (obj: fabric.FabricObject, canvas: fabric.Canvas) => {
    canvas.bringObjectToFront(obj)
    canvas.renderAll()
}

export const sendObjectToBack = (obj: fabric.FabricObject, canvas: fabric.Canvas) => {
    canvas.sendObjectToBack(obj)
    canvas.renderAll()
}

export const bringObjectForward = (obj: fabric.FabricObject, canvas: fabric.Canvas) => {
    canvas.bringObjectForward(obj)
    canvas.renderAll()
}

export const sendObjectBackward = (obj: fabric.FabricObject, canvas: fabric.Canvas) => {
    canvas.sendObjectBackwards(obj)
    canvas.renderAll()
}

/**
 * Zoom controls
 */
export const zoomIn = (canvas: fabric.Canvas, currentZoom: number): number => {
    let newZoom = currentZoom * 1.2
    if (newZoom > 5) newZoom = 5
    canvas.setZoom(newZoom)
    canvas.renderAll()
    return newZoom
}

export const zoomOut = (canvas: fabric.Canvas, currentZoom: number): number => {
    let newZoom = currentZoom / 1.2
    if (newZoom < 0.1) newZoom = 0.1
    canvas.setZoom(newZoom)
    canvas.renderAll()
    return newZoom
}

export const resetZoom = (canvas: fabric.Canvas, baseScale: number): number => {
    canvas.setZoom(baseScale)
    canvas.viewportTransform = [baseScale, 0, 0, baseScale, 0, 0]
    canvas.renderAll()
    return baseScale
}
