/**
 * Shape Factory - Funciones para crear objetos de Fabric.js
 */

import * as fabric from 'fabric'

export const createText = (canvas: fabric.Canvas) => {
    const text = new fabric.Textbox('Haz clic para editar', {
        left: 100,
        top: 100,
        width: 800,
        fontSize: 60,
        fill: '#ffffff',
        fontFamily: 'Arial',
        editable: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    text.enterEditing()
    text.selectAll()
    canvas.renderAll()

    return text
}

export const createRectangle = (canvas: fabric.Canvas) => {
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 400,
        height: 200,
        fill: '#667eea',
        stroke: '#ffffff',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
    })

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()

    return rect
}

export const createCircle = (canvas: fabric.Canvas) => {
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 100,
        fill: '#51cf66',
        stroke: '#ffffff',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
    })

    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()

    return circle
}

export const createTriangle = (canvas: fabric.Canvas) => {
    const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        fill: '#ff6b6b',
        stroke: '#ffffff',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
    })

    canvas.add(triangle)
    canvas.setActiveObject(triangle)
    canvas.renderAll()

    return triangle
}

export const addImageToCanvas = async (canvas: fabric.Canvas, imgSrc: string) => {
    try {
        const img = await fabric.FabricImage.fromURL(imgSrc, {
            crossOrigin: 'anonymous'
        })

        // Scale image to fit canvas if too large
        const maxWidth = 800
        const maxHeight = 600
        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!, 1)

        img.set({
            left: 100,
            top: 100,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })

        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()

        return img
    } catch (err) {
        console.error('Error loading image:', err)
        throw err
    }
}
