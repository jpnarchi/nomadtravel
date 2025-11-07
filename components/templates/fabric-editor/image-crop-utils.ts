/**
 * Image Crop Utils - Utilidades para recortar imágenes
 */

import * as fabric from 'fabric'

export interface CropData {
    left: number
    top: number
    width: number
    height: number
}

/**
 * Aplica un recorte a una imagen usando clipPath
 */
export const applyCropToImage = (
    image: fabric.FabricImage,
    cropData: CropData,
    canvas: fabric.Canvas
) => {
    const { left, top, width, height } = cropData

    // Crear un rectángulo para el clipPath en coordenadas relativas al objeto
    const clipRect = new fabric.Rect({
        left: left - (image.left || 0),
        top: top - (image.top || 0),
        width: width,
        height: height,
        absolutePositioned: false,
    })

    // Aplicar el clipPath
    image.set({
        clipPath: clipRect
    })

    canvas.renderAll()
}

/**
 * Activa el modo de recorte para una imagen
 * Retorna una función para desactivar el modo de recorte
 */
export const enterCropMode = (
    image: fabric.FabricImage,
    canvas: fabric.Canvas,
    onCropComplete: (cropData: CropData) => void
): (() => void) => {
    // Guardar el estado original de la imagen
    const originalLeft = image.left || 0
    const originalTop = image.top || 0
    const originalScaleX = image.scaleX || 1
    const originalScaleY = image.scaleY || 1
    const imageWidth = (image.width || 0) * originalScaleX
    const imageHeight = (image.height || 0) * originalScaleY

    // Deshabilitar la edición de la imagen y otros objetos
    image.set({
        selectable: false,
        evented: false,
    })

    canvas.selection = false
    canvas.getObjects().forEach(obj => {
        if (obj !== image) {
            obj.set({
                selectable: false,
                evented: false,
            })
        }
    })

    // Crear el área de recorte (inicialmente cubre el 80% de la imagen)
    const initialWidth = imageWidth * 0.8
    const initialHeight = imageHeight * 0.8
    const initialLeft = originalLeft + (imageWidth - initialWidth) / 2
    const initialTop = originalTop + (imageHeight - initialHeight) / 2

    const cropRect = new fabric.Rect({
        left: initialLeft,
        top: initialTop,
        width: initialWidth,
        height: initialHeight,
        fill: 'rgba(0, 255, 0, 0.1)',
        stroke: '#00ff00',
        strokeWidth: 3,
        strokeDashArray: [10, 5],
        cornerColor: '#00ff00',
        cornerSize: 12,
        cornerStyle: 'circle',
        transparentCorners: false,
        lockRotation: true,
        hasRotatingPoint: false,
        borderColor: '#00ff00',
        borderScaleFactor: 2,
    })

    // Añadir el rectángulo de recorte al canvas
    canvas.add(cropRect)
    canvas.setActiveObject(cropRect)
    canvas.renderAll()

    // Función para salir del modo de recorte
    const exitCropMode = (applyCrop: boolean = false) => {
        // Remover el rectángulo de recorte
        canvas.remove(cropRect)

        // Restaurar la selección de objetos
        canvas.selection = true
        image.set({
            selectable: true,
            evented: true,
        })
        canvas.getObjects().forEach(obj => {
            obj.set({
                selectable: true,
                evented: true,
            })
        })

        if (applyCrop) {
            // Obtener los datos del recorte
            const cropData: CropData = {
                left: cropRect.left || 0,
                top: cropRect.top || 0,
                width: (cropRect.width || 0) * (cropRect.scaleX || 1),
                height: (cropRect.height || 0) * (cropRect.scaleY || 1),
            }

            onCropComplete(cropData)
        }

        canvas.setActiveObject(image)
        canvas.renderAll()
    }

    return exitCropMode
}

/**
 * Aplica border radius a un objeto (imagen o forma)
 */
export const applyBorderRadius = (
    obj: fabric.FabricObject,
    radius: number,
    canvas: fabric.Canvas
) => {
    if (obj.type === 'rect') {
        // Para rectángulos, usar rx y ry directamente
        obj.set({
            rx: radius,
            ry: radius,
        })
        console.log('✅ Border radius aplicado a rectángulo:', radius)
    } else if (obj.type === 'image') {
        // Para imágenes, usar clipPath con rectángulo redondeado
        const imageObj = obj as fabric.FabricImage
        const objWidth = (imageObj.width || 0)
        const objHeight = (imageObj.height || 0)
        const scaleX = imageObj.scaleX || 1
        const scaleY = imageObj.scaleY || 1

        // Obtener el clipPath existente si existe
        const existingClipPath = (imageObj as any).clipPath

        // Preservar las dimensiones del recorte si existe
        let clipWidth = objWidth
        let clipHeight = objHeight
        let clipLeft = 0
        let clipTop = 0

        if (existingClipPath && existingClipPath.type === 'rect') {
            // Preservar las dimensiones del recorte
            clipWidth = existingClipPath.width || objWidth
            clipHeight = existingClipPath.height || objHeight
            clipLeft = existingClipPath.left || 0
            clipTop = existingClipPath.top || 0
            console.log('📐 Preservando dimensiones de recorte:', { width: clipWidth, height: clipHeight, left: clipLeft, top: clipTop })
        }

        // Crear o actualizar el clipPath
        const clipRect = new fabric.Rect({
            left: clipLeft,
            top: clipTop,
            width: clipWidth,
            height: clipHeight,
            rx: radius / scaleX,
            ry: radius / scaleY,
            absolutePositioned: false,
        })

        imageObj.set({
            clipPath: clipRect
        })

        console.log('✅ Border radius aplicado a imagen:', {
            radius,
            scaledRadius: { rx: radius / scaleX, ry: radius / scaleY },
            clipDimensions: { width: clipWidth, height: clipHeight }
        })
    } else if (obj.type === 'circle' || obj.type === 'triangle') {
        // Los círculos y triángulos no tienen border radius nativo
        console.log('⚠️ Border radius no soportado para', obj.type)
    }

    canvas.renderAll()
}

/**
 * Obtiene el border radius actual de un objeto
 */
export const getBorderRadius = (obj: fabric.FabricObject): number => {
    if (obj.type === 'rect') {
        const rx = (obj as any).rx || 0
        console.log('📏 Border radius de rectángulo:', rx)
        return rx
    } else if (obj.type === 'image') {
        const clipPath = (obj as any).clipPath
        if (clipPath && clipPath.type === 'rect') {
            const rx = clipPath.rx || 0
            const scaleX = (obj as any).scaleX || 1
            const scaledRadius = rx * scaleX
            console.log('📏 Border radius de imagen:', { rx, scaleX, scaledRadius })
            return scaledRadius
        }
    }
    return 0
}

/**
 * Elimina el clipPath de un objeto
 */
export const removeClipPath = (obj: fabric.FabricObject, canvas: fabric.Canvas) => {
    obj.set({ clipPath: undefined })
    canvas.renderAll()
}
