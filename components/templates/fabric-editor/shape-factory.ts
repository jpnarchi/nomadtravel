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
        lineHeight: 1.16,
        editable: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
    })

    // Set default list style to bullets
    // @ts-expect-error - Custom property
    text.listStyle = 'bullets'

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

export const createLine = (canvas: fabric.Canvas) => {
    const line = new fabric.Line([100, 100, 500, 100], {
        stroke: '#ffffff',
        strokeWidth: 4,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        strokeLineCap: 'round',
    })

    canvas.add(line)
    canvas.setActiveObject(line)
    canvas.renderAll()

    return line
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

export const createImagePlaceholder = (canvas: fabric.Canvas) => {
    const containerWidth = 400
    const containerHeight = 300
    const defaultBorderRadius = 8

    // Create a rectangle as the container with gradient-like appearance
    // Position it at center (0, 0) relative to group center
    const rect = new fabric.Rect({
        width: containerWidth,
        height: containerHeight,
        fill: '#f8fafc', // Lighter, more modern gray
        stroke: '#94a3b8', // Slate-400 for better contrast
        strokeWidth: 2,
        strokeDashArray: [12, 8],
        rx: defaultBorderRadius,
        ry: defaultBorderRadius,
        left: -containerWidth / 2,
        top: -containerHeight / 2,
        originX: 'left',
        originY: 'top',
    })

    // Create inner border for depth
    const innerRect = new fabric.Rect({
        width: containerWidth - 20,
        height: containerHeight - 20,
        fill: 'transparent',
        stroke: '#cbd5e1', // Lighter inner border
        strokeWidth: 1,
        strokeDashArray: [6, 4],
        rx: Math.max(0, defaultBorderRadius - 2),
        ry: Math.max(0, defaultBorderRadius - 2),
        left: -(containerWidth - 20) / 2,
        top: -(containerHeight - 20) / 2,
        originX: 'left',
        originY: 'top',
    })

    // Create Sparkles icon using paths (simplified sparkle shape)
    const sparkleSize = 60

    // Create a star/sparkle shape using a path
    // The path coordinates go from 0 to 50, so we need to center it properly
    const sparklePath = new fabric.Path(
        'M 25 0 L 30 20 L 50 25 L 30 30 L 25 50 L 20 30 L 0 25 L 20 20 Z',
        {
            fill: '#f59e0b', // More vibrant amber
            scaleX: sparkleSize / 50,
            scaleY: sparkleSize / 50,
            left: -25 * (sparkleSize / 50), // Center the path (25 is center of 0-50)
            top: -25 * (sparkleSize / 50) - 20, // Center and move up
            originX: 'left',
            originY: 'top',
        }
    )

    // Add small sparkles around the main one
    const smallSparkle1 = new fabric.Path(
        'M 25 0 L 30 20 L 50 25 L 30 30 L 25 50 L 20 30 L 0 25 L 20 20 Z',
        {
            fill: '#fbbf24',
            scaleX: 0.35,
            scaleY: 0.35,
            left: 35,
            top: -40,
            originX: 'center',
            originY: 'center',
            opacity: 0.8,
        }
    )

    const smallSparkle2 = new fabric.Path(
        'M 25 0 L 30 20 L 50 25 L 30 30 L 25 50 L 20 30 L 0 25 L 20 20 Z',
        {
            fill: '#fde047', // Lighter yellow
            scaleX: 0.28,
            scaleY: 0.28,
            left: -35,
            top: -25,
            originX: 'center',
            originY: 'center',
            opacity: 0.7,
        }
    )

    // Create text label - center it horizontally
    const text = new fabric.Text('Add image', {
        fontSize: 20,
        fill: '#475569', // Darker slate for better readability
        fontFamily: 'Arial',
        fontWeight: '600',
        originX: 'center',
        originY: 'top',
        left: 0, // Centered
        top: 25, // Below the sparkle
    })

    // Group all elements
    const group = new fabric.Group(
        [rect, innerRect, sparklePath, smallSparkle1, smallSparkle2, text],
        {
            left: 100,
            top: 100,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            subTargetCheck: false, // Treat as single object
        }
    )

    // Add custom properties to identify this as an image placeholder
    ;(group as any).isImagePlaceholder = true
    ;(group as any).placeholderWidth = containerWidth
    ;(group as any).placeholderHeight = containerHeight
    ;(group as any).borderRadius = defaultBorderRadius

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()

    return group
}

export const replaceImagePlaceholderWithImage = async (
    canvas: fabric.Canvas,
    placeholder: fabric.FabricObject,
    imgSrc: string
) => {
    try {
        const img = await fabric.FabricImage.fromURL(imgSrc, {
            crossOrigin: 'anonymous'
        })

        // Get placeholder position, size, and border radius
        // For groups, we need to account for the scale and get the actual canvas position
        const placeholderWidth = (placeholder as any).placeholderWidth * (placeholder.scaleX || 1)
        const placeholderHeight = (placeholder as any).placeholderHeight * (placeholder.scaleY || 1)

        // Get the true center position of the placeholder on the canvas
        // This works for both groups and individual objects
        const placeholderLeft = placeholder.getCenterPoint().x
        const placeholderTop = placeholder.getCenterPoint().y
        const placeholderAngle = placeholder.angle || 0
        const borderRadius = (placeholder as any).borderRadius || 0

        console.log('📍 Placeholder position:', {
            left: placeholderLeft,
            top: placeholderTop,
            width: placeholderWidth,
            height: placeholderHeight,
            angle: placeholderAngle,
            borderRadius: borderRadius
        })

        // Calculate scale to cover the container (like CSS object-fit: cover)
        const scaleX = placeholderWidth / img.width!
        const scaleY = placeholderHeight / img.height!
        const scale = Math.max(scaleX, scaleY)

        // Calculate how much of the image will be visible after scaling
        const scaledImageWidth = img.width! * scale
        const scaledImageHeight = img.height! * scale

        // Calculate crop values to center the image in the container
        // cropX and cropY are in image coordinates (before scaling)
        const cropX = (scaledImageWidth - placeholderWidth) / (2 * scale)
        const cropY = (scaledImageHeight - placeholderHeight) / (2 * scale)

        // Create a rounded rectangle clipPath if borderRadius is set
        let clipPath = undefined
        if (borderRadius > 0) {
            // Calculate the border radius relative to the image scale
            const clipBorderRadius = borderRadius / scale

            clipPath = new fabric.Rect({
                width: img.width! - (cropX * 2),
                height: img.height! - (cropY * 2),
                rx: clipBorderRadius,
                ry: clipBorderRadius,
                left: -(img.width! - (cropX * 2)) / 2,
                top: -(img.height! - (cropY * 2)) / 2,
                originX: 'left',
                originY: 'top',
            })
        }

        // Set the image properties for "cover" effect using crop
        img.set({
            left: placeholderLeft,
            top: placeholderTop,
            angle: placeholderAngle,
            originX: 'center',
            originY: 'center',
            scaleX: scale,
            scaleY: scale,
            cropX: cropX,
            cropY: cropY,
            width: img.width! - (cropX * 2), // Visible width before scaling
            height: img.height! - (cropY * 2), // Visible height before scaling
            clipPath: clipPath,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
        })

        // Store the border radius as a custom property for later editing
        ;(img as any).borderRadius = borderRadius
        ;(img as any).isImageContainer = true

        // Remove placeholder and add image
        canvas.remove(placeholder)
        canvas.add(img)

        // Bring image to front
        canvas.bringObjectToFront(img)

        canvas.setActiveObject(img)
        canvas.renderAll()

        return img
    } catch (err) {
        console.error('Error loading image:', err)
        throw err
    }
}
