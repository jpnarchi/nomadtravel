/**
 * Canvas Utils - Utilidades para operaciones con el canvas de Fabric.js
 */

import * as fabric from 'fabric'

/**
 * Serializa el canvas a JSON
 */
export const serializeCanvas = (canvas: fabric.Canvas, backgroundColor: string) => {
    // CRITICAL FIX: Handle ActiveSelection (multiple objects selected)
    // When multiple objects are selected, they form an ActiveSelection group
    // where objects have coordinates relative to the group center, not the canvas
    // We need to calculate absolute coordinates before serializing
    const activeObject = canvas.getActiveObject()
    // IMPORTANT: Fabric.js returns 'activeselection' in lowercase!
    const isActiveSelection = activeObject?.type?.toLowerCase() === 'activeselection'

    console.log('🔧 serializeCanvas llamado:', {
        hasActiveObject: !!activeObject,
        activeObjectType: activeObject?.type,
        isActiveSelection
    })

    // Store absolute coordinates for objects in ActiveSelection
    const absoluteCoords = new Map<fabric.FabricObject, { left: number; top: number }>()

    if (isActiveSelection && activeObject) {
        const activeSelection = activeObject as fabric.ActiveSelection
        const selectedObjects = activeSelection.getObjects()

        console.log('✅ ActiveSelection detectada!', {
            numObjects: selectedObjects.length,
            types: selectedObjects.map(o => o.type)
        })

        // Calculate absolute coordinates for each selected object
        selectedObjects.forEach(obj => {
            // Get the absolute center point of the object on the canvas
            const centerPoint = obj.getCenterPoint()

            // Get scaled dimensions (width and height considering scale)
            const width = obj.getScaledWidth()
            const height = obj.getScaledHeight()

            // Calculate left and top based on center point and origin
            // getCenterPoint() always returns the visual center of the object
            // We need to calculate where the origin point (left/top) should be
            let left: number
            let top: number

            // Calculate left based on originX
            if (obj.originX === 'left') {
                left = centerPoint.x - width / 2
            } else if (obj.originX === 'center') {
                left = centerPoint.x
            } else if (obj.originX === 'right') {
                left = centerPoint.x + width / 2
            } else {
                // Default to 'left'
                left = centerPoint.x - width / 2
            }

            // Calculate top based on originY
            if (obj.originY === 'top') {
                top = centerPoint.y - height / 2
            } else if (obj.originY === 'center') {
                top = centerPoint.y
            } else if (obj.originY === 'bottom') {
                top = centerPoint.y + height / 2
            } else {
                // Default to 'top'
                top = centerPoint.y - height / 2
            }

            absoluteCoords.set(obj, { left, top })

            console.log(`🔍 Calculando coords absolutas para ${obj.type}:`, {
                centerPoint,
                size: { width, height },
                origin: { x: obj.originX, y: obj.originY },
                calculated: { left, top }
            })
        })
    }

    const objects = canvas.getObjects()
        .filter(obj => !(obj as any).isAlignmentGuide) // Exclude alignment guides
        .map((obj, index) => {
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
            'listStyle', // Bullet points, dashes, numbers
            'width', // Include width for Textbox objects (text wrapping)
            'height', // Include height
            // Image-specific properties
            'src', // Include src for Image objects
            'cropX', // Crop properties for image containers
            'cropY',
            'clipPath', // Clip path for rounded corners
            // Position and transform properties (critical for images)
            'left',
            'top',
            'scaleX',
            'scaleY',
            'angle',
            'originX',
            'originY',
            // Custom properties for image placeholders and containers
            'isImagePlaceholder',
            'isImageContainer',
            'placeholderWidth',
            'placeholderHeight',
            'borderRadius',
            // Ring-specific properties
            'isRing',
            'ringRadius',
            'ringThickness',
            'ringColor',
            'outerRadius',
            'innerRadius',
        ])

        // Add z-index to preserve layer order
        json.zIndex = index

        // Special handling for image placeholders (groups)
        if ((obj as any).isImagePlaceholder && obj.type === 'group') {
            json.isImagePlaceholder = true
            json.placeholderWidth = (obj as any).placeholderWidth
            json.placeholderHeight = (obj as any).placeholderHeight
            json.borderRadius = (obj as any).borderRadius || 0

            console.log('📦 Serializando contenedor de imagen:', {
                type: obj.type,
                position: { left: json.left, top: json.top },
                size: { width: json.placeholderWidth, height: json.placeholderHeight },
                borderRadius: json.borderRadius,
                zIndex: index
            })
        }

        // Special handling for image containers
        if ((obj as any).isImageContainer && obj.type === 'image') {
            json.isImageContainer = true
            json.borderRadius = (obj as any).borderRadius || 0
            json.cropX = (obj as any).cropX
            json.cropY = (obj as any).cropY

            console.log('🖼️ Serializando imagen con container:', {
                type: obj.type,
                src: json.src,
                position: { left: json.left, top: json.top },
                origin: { originX: json.originX, originY: json.originY },
                scale: { scaleX: json.scaleX, scaleY: json.scaleY },
                size: { width: json.width, height: json.height },
                borderRadius: json.borderRadius,
                crop: { cropX: json.cropX, cropY: json.cropY },
                angle: json.angle,
                clipPath: json.clipPath ? 'presente' : 'ausente'
            })
        }

        // Special handling for images - Fabric.js doesn't always serialize src
        if (obj.type?.toLowerCase() === 'image') {
            const imgObj = obj as any
            // Try different ways to get the image source
            json.src = json.src || imgObj.src || imgObj._element?.src || imgObj._originalElement?.src || imgObj.getSrc?.()

            // Ensure position properties are captured
            json.left = imgObj.left
            json.top = imgObj.top
            json.scaleX = imgObj.scaleX
            json.scaleY = imgObj.scaleY
            json.angle = imgObj.angle
            json.width = imgObj.width
            json.height = imgObj.height

            console.log('🖼️ Serializando imagen:', {
                type: obj.type,
                src: json.src,
                position: { left: json.left, top: json.top },
                scale: { scaleX: json.scaleX, scaleY: json.scaleY },
                angle: json.angle,
                size: { width: json.width, height: json.height },
                zIndex: index,
                fullJson: json
            })
        }

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

        // CRITICAL: Override coordinates with absolute values for objects in ActiveSelection
        if (absoluteCoords.has(obj)) {
            const coords = absoluteCoords.get(obj)!
            const beforeLeft = json.left
            const beforeTop = json.top

            json.left = coords.left
            json.top = coords.top

            console.log(`📍 Corrigiendo coordenadas de objeto ${index} en ActiveSelection:`, {
                type: obj.type,
                before: { left: beforeLeft, top: beforeTop },
                after: { left: coords.left, top: coords.top }
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
        'charSpacing', 'styles', 'editable', 'listStyle', 'width', 'height',
        'src', // Include src for Image objects
        // Position and transform properties
        'left', 'top', 'scaleX', 'scaleY', 'angle', 'originX', 'originY',
        // Ring properties
        'isRing', 'ringRadius', 'ringThickness', 'ringColor', 'outerRadius', 'innerRadius'
    ])

    // Special handling for images - Fabric.js doesn't always serialize src
    if (obj.type?.toLowerCase() === 'image') {
        const imgObj = obj as any
        // Try different ways to get the image source
        objectData.src = objectData.src || imgObj.src || imgObj._element?.src || imgObj._originalElement?.src || imgObj.getSrc?.()

        // Ensure position properties are captured
        objectData.left = imgObj.left
        objectData.top = imgObj.top
        objectData.scaleX = imgObj.scaleX
        objectData.scaleY = imgObj.scaleY
        objectData.angle = imgObj.angle
        objectData.width = imgObj.width
        objectData.height = imgObj.height

        console.log('📋 Imagen copiada:', {
            type: obj.type,
            src: objectData.src,
            position: { left: objectData.left, top: objectData.top },
            scale: { scaleX: objectData.scaleX, scaleY: objectData.scaleY },
            angle: objectData.angle,
            size: { width: objectData.width, height: objectData.height },
            fullData: objectData
        })
    }

    console.log('📋 Objeto copiado:', objectData)
    return objectData
}

/**
 * Pega un objeto desde JSON en el canvas
 * Note: objData should already have the desired left/top position (offset applied by caller if needed)
 */
export const pasteObjectFromJSON = async (canvas: fabric.Canvas, objData: any): Promise<fabric.FabricObject | null> => {
    const objType = (objData.type || '').toLowerCase()

    console.log('📋 Pegando objeto tipo:', objType, objData)

    // CRITICAL: Store viewport transform and temporarily reset it
    // This ensures coordinates are interpreted as canvas coordinates, not viewport coordinates
    const vpt = canvas.viewportTransform
    const zoom = canvas.getZoom()
    console.log('📐 Canvas viewport antes de pegar:', { vpt, zoom })

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
                        left: objData.left,
                        top: objData.top,
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
                    // @ts-expect-error - Custom property
                    if (objData.listStyle) newObj.listStyle = objData.listStyle
                } else {
                    newObj = new fabric.IText(objData.text || 'Text', {
                        left: objData.left,
                        top: objData.top,
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
                    // @ts-expect-error - Custom property
                    if (objData.listStyle) newObj.listStyle = objData.listStyle
                }
                break
            case 'rect':
            case 'rectangle':
                newObj = new fabric.Rect({
                    left: objData.left,
                    top: objData.top,
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
                    originX: objData.originX || 'left',
                    originY: objData.originY || 'top',
                })
                break
            case 'circle':
                newObj = new fabric.Circle({
                    left: objData.left,
                    top: objData.top,
                    radius: objData.radius,
                    fill: objData.fill,
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                    angle: objData.angle,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                    originX: objData.originX || 'left',
                    originY: objData.originY || 'top',
                })
                // Restore ring properties if it's a ring
                if (objData.isRing) {
                    ;(newObj as any).isRing = true
                    ;(newObj as any).ringRadius = objData.ringRadius
                    ;(newObj as any).ringThickness = objData.ringThickness
                    ;(newObj as any).ringColor = objData.ringColor
                    ;(newObj as any).outerRadius = objData.outerRadius
                    ;(newObj as any).innerRadius = objData.innerRadius
                }
                break
            case 'triangle':
                newObj = new fabric.Triangle({
                    left: objData.left,
                    top: objData.top,
                    width: objData.width,
                    height: objData.height,
                    fill: objData.fill,
                    stroke: objData.stroke,
                    strokeWidth: objData.strokeWidth,
                    angle: objData.angle,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                    originX: objData.originX || 'left',
                    originY: objData.originY || 'top',
                })
                break
            case 'line':
                // Use fromObject to avoid double-transformation issues
                console.log('📏 Pegando línea con fromObject:', objData)
                newObj = await fabric.Line.fromObject(objData)
                console.log('✅ Línea pegada con posición:', { left: newObj.left, top: newObj.top, angle: newObj.angle })
                break
            case 'image':
                console.log('🖼️ Intentando pegar imagen con src:', objData.src)
                if (objData.src) {
                    try {
                        const img = await fabric.FabricImage.fromURL(objData.src, { crossOrigin: 'anonymous' })
                        img.set({
                            left: objData.left,
                            top: objData.top,
                            scaleX: objData.scaleX || 1,
                            scaleY: objData.scaleY || 1,
                            angle: objData.angle || 0,
                        })
                        newObj = img
                        console.log('✅ Imagen pegada exitosamente')
                    } catch (error) {
                        console.error('❌ Error cargando imagen desde URL:', error)
                        throw error
                    }
                } else {
                    console.error('❌ Imagen sin src, no se puede pegar')
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

            console.log('📍 Objeto antes de agregar al canvas:', {
                type: newObj.type,
                left: newObj.left,
                top: newObj.top,
                expectedLeft: objData.left,
                expectedTop: objData.top
            })

            canvas.add(newObj)

            console.log('📍 Objeto DESPUÉS de agregar al canvas:', {
                type: newObj.type,
                left: newObj.left,
                top: newObj.top,
                aCoords: newObj.aCoords
            })

            // DON'T set as active object here - let the caller handle selection
            // This prevents coordinate transformation when multiple objects are pasted
            canvas.renderAll()

            console.log('✅ Objeto pegado en posición final:', {
                left: newObj.left,
                top: newObj.top
            })
        }

        return newObj
    } catch (error) {
        console.error('❌ Error al pegar objeto:', error)
        throw error
    }
}

/**
 * Aplica formato de bullet points al texto
 */
export const applyListFormatting = (text: string, listStyle: string): string => {
    if (!text || listStyle === 'none') return text

    // Split by line breaks
    const lines = text.split('\n')

    // Track number for numbered lists (only count non-empty lines)
    let numberCounter = 1

    // Apply formatting to each line
    const formattedLines = lines.map((line) => {
        // Skip empty lines (preserve them as-is)
        if (!line.trim()) return line

        // Remove existing bullets/numbers from the line
        const cleanedLine = line.replace(/^(\s*)(•|\d+\.)\s*/, '$1')

        let formattedLine = cleanedLine
        switch (listStyle) {
            case 'bullets':
                formattedLine = cleanedLine ? `• ${cleanedLine}` : cleanedLine
                break
            case 'numbers':
                formattedLine = cleanedLine ? `${numberCounter}. ${cleanedLine}` : cleanedLine
                if (cleanedLine) numberCounter++
                break
            default:
                formattedLine = cleanedLine
        }

        return formattedLine
    })

    return formattedLines.join('\n')
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

    // If updating listStyle, apply formatting to the text
    if (property === 'listStyle' && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        const textObj = obj as any
        const currentText = textObj.text || ''
        const formattedText = applyListFormatting(currentText, value)
        textObj.set('text', formattedText)
    }

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
 * Zoom controls - Viewport-only zoom (doesn't affect object sizes)
 * This approach matches the preview: we calculate a new canvas size based on zoom level
 */
export const zoomIn = (canvas: fabric.Canvas, currentZoom: number, baseScale: number, canvasWidth: number, canvasHeight: number): number => {
    let newZoom = currentZoom * 1.2
    if (newZoom > 5) newZoom = 5

    // Calculate new canvas dimensions based on zoom
    const displayWidth = canvasWidth * newZoom
    const displayHeight = canvasHeight * newZoom

    // Update canvas dimensions and viewport transform
    canvas.setWidth(displayWidth)
    canvas.setHeight(displayHeight)
    canvas.setZoom(newZoom)
    canvas.viewportTransform = [newZoom, 0, 0, newZoom, 0, 0]
    canvas.renderAll()

    return newZoom
}

export const zoomOut = (canvas: fabric.Canvas, currentZoom: number, baseScale: number, canvasWidth: number, canvasHeight: number): number => {
    let newZoom = currentZoom / 1.2
    if (newZoom < baseScale * 0.5) newZoom = baseScale * 0.5 // Min 50% of base scale

    // Calculate new canvas dimensions based on zoom
    const displayWidth = canvasWidth * newZoom
    const displayHeight = canvasHeight * newZoom

    // Update canvas dimensions and viewport transform
    canvas.setWidth(displayWidth)
    canvas.setHeight(displayHeight)
    canvas.setZoom(newZoom)
    canvas.viewportTransform = [newZoom, 0, 0, newZoom, 0, 0]
    canvas.renderAll()

    return newZoom
}

export const resetZoom = (canvas: fabric.Canvas, baseScale: number, canvasWidth: number, canvasHeight: number): number => {
    // Reset to base scale
    const displayWidth = canvasWidth * baseScale
    const displayHeight = canvasHeight * baseScale

    canvas.setWidth(displayWidth)
    canvas.setHeight(displayHeight)
    canvas.setZoom(baseScale)
    canvas.viewportTransform = [baseScale, 0, 0, baseScale, 0, 0]
    canvas.renderAll()

    return baseScale
}
