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

    // Set default list style to none (users can enable it from the sidebar)
    // @ts-expect-error - Custom property
    text.listStyle = 'none'

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
        strokeUniform: true,
        paintFirst: 'fill',
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
        strokeUniform: true,
        paintFirst: 'fill',
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
        strokeUniform: true,
        paintFirst: 'fill',
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
        strokeUniform: true,
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

export const createRing = (canvas: fabric.Canvas, options?: {
    radius?: number
    ringThickness?: number
    ringColor?: string
    strokeWidth?: number
    strokeColor?: string
}) => {
    // Default values
    const thickness = options?.ringThickness || 50
    const radius = options?.radius || 100
    const ringColor = options?.ringColor || '#fbbf24'
    const strokeWidth = options?.strokeWidth || 0
    const strokeColor = options?.strokeColor || '#ffffff'

    // Create a circle with thick stroke and transparent fill
    // The radius is the center of the ring (middle of the thickness)
    const ring = new fabric.Circle({
        left: 100,
        top: 100,
        radius: radius,
        fill: 'transparent', // ALWAYS transparent - this is the key
        stroke: ringColor, // The ring color
        strokeWidth: thickness, // The thickness of the ring
        strokeUniform: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        originX: 'center',
        originY: 'center',
    })

    // Store custom properties for later editing
    ;(ring as any).isRing = true
    ;(ring as any).ringRadius = radius
    ;(ring as any).ringThickness = thickness
    ;(ring as any).ringColor = ringColor
    ;(ring as any).outerRadius = radius + (thickness / 2)
    ;(ring as any).innerRadius = radius - (thickness / 2)

    canvas.add(ring)
    canvas.setActiveObject(ring)
    canvas.renderAll()

    return ring
}

export const updateRingThickness = (ring: fabric.FabricObject, newThickness: number) => {
    if (!(ring as any).isRing) return

    const minThickness = 5
    const maxThickness = 200
    const validThickness = Math.max(minThickness, Math.min(maxThickness, newThickness))

    // Update the strokeWidth (which is the ring thickness)
    ring.set({ strokeWidth: validThickness })

    // Update stored properties
    ;(ring as any).ringThickness = validThickness
    const radius = (ring as any).ringRadius
    ;(ring as any).outerRadius = radius + (validThickness / 2)
    ;(ring as any).innerRadius = radius - (validThickness / 2)

    ring.setCoords()
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

export const createImagePlaceholder = async (canvas: fabric.Canvas) => {
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

    // Load logo image
    const logo = await fabric.FabricImage.fromURL('/logo.png', {
        crossOrigin: 'anonymous'
    })

    // Scale logo to fit nicely inside container (max 150px)
    const logoMaxSize = 150
    const logoScale = Math.min(
        logoMaxSize / logo.width!,
        logoMaxSize / logo.height!,
        1
    )

    // Store original logo dimensions for reference
    const logoOriginalWidth = logo.width! * logoScale
    const logoOriginalHeight = logo.height! * logoScale

    logo.set({
        scaleX: logoScale,
        scaleY: logoScale,
        left: 0,
        top: 0,
        originX: 'center',
        originY: 'center',
    })

    // Group all elements
    const group = new fabric.Group(
        [rect, innerRect, logo],
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
    ;(group as any).logoOriginalWidth = logoOriginalWidth
    ;(group as any).logoOriginalHeight = logoOriginalHeight

    // Add event listener to maintain logo aspect ratio when scaling
    group.on('scaling', () => {
        const currentGroup = group as any
        const groupScaleX = currentGroup.scaleX || 1
        const groupScaleY = currentGroup.scaleY || 1

        // Get the logo from the group
        const groupLogo = currentGroup._objects[2] // Logo is the 3rd element

        if (groupLogo) {
            // Calculate the container's new dimensions
            const newContainerWidth = containerWidth * groupScaleX
            const newContainerHeight = containerHeight * groupScaleY

            // Calculate scale to fit logo inside container while maintaining aspect ratio
            // Use Math.min to ensure it fits (like object-fit: contain)
            // The logo will scale proportionally with the container size
            const fitScale = Math.min(
                (newContainerWidth * 0.6) / logoOriginalWidth,  // Use 60% of container
                (newContainerHeight * 0.6) / logoOriginalHeight
            )

            // Apply the scale to the logo to counteract group scaling
            groupLogo.set({
                scaleX: logoScale * fitScale / groupScaleX,
                scaleY: logoScale * fitScale / groupScaleY,
            })
        }
    })

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

/**
 * TEXT FLEXBOX - Container for multiple text boxes
 */

export interface TextFlexboxOptions {
    width?: number
    height?: number
    direction?: 'vertical' | 'horizontal'
    align?: 'start' | 'center' | 'end' | 'space-between'
    gap?: number
    padding?: number
    backgroundColor?: string
    borderRadius?: number
}

/**
 * Reorganiza los textos del flexbox según las propiedades
 */
export const layoutFlexboxTexts = (canvas: fabric.Canvas, flexboxId: string, direction: 'vertical' | 'horizontal', gap: number) => {
    // Get all texts in this flexbox
    const allObjects = canvas.getObjects()
    const flexboxTexts = allObjects.filter(obj =>
        (obj as any).isInFlexbox && (obj as any).flexboxId === flexboxId
    ).sort((a, b) => ((a as any).flexboxIndex || 0) - ((b as any).flexboxIndex || 0))

    if (flexboxTexts.length === 0) return

    // Get starting position from first text
    const firstText = flexboxTexts[0]
    const startX = firstText.left || 100
    const startY = firstText.top || 100

    // Re-layout based on direction
    flexboxTexts.forEach((text, index) => {
        if (direction === 'vertical') {
            text.set({
                left: startX,
                top: startY + index * ((text.height || 60) + gap)
            })
        } else {
            text.set({
                left: startX + index * ((text.width || 400) + gap),
                top: startY
            })
        }

        // Update stored properties
        ;(text as any).flexboxDirection = direction
        ;(text as any).flexboxGap = gap

        text.setCoords()
    })

    canvas.renderAll()
}

/**
 * Crea un TextFlexbox - Sistema de organización de textos independientes
 */
export const createTextFlexbox = (canvas: fabric.Canvas, options?: TextFlexboxOptions) => {
    const direction = options?.direction || 'vertical'
    const gap = options?.gap || 20
    const startX = 100
    const startY = 100

    // Generate unique flexbox ID
    const flexboxId = `flexbox_${Date.now()}`

    // Create independent text objects
    const texts = []

    for (let i = 0; i < 3; i++) {
        const text = new fabric.Textbox(`Texto ${i + 1}`, {
            fontSize: 24,
            fill: '#000000',
            fontFamily: 'Arial',
            width: 400,
            editable: true,
            left: startX,
            top: startY + (direction === 'vertical' ? i * (60 + gap) : 0),
            hasControls: true,
            hasBorders: true,
        })

        // Mark as part of flexbox
        ;(text as any).isInFlexbox = true
        ;(text as any).flexboxId = flexboxId
        ;(text as any).flexboxIndex = i
        ;(text as any).flexboxDirection = direction
        ;(text as any).flexboxGap = gap

        texts.push(text)
        canvas.add(text)
    }

    // Select all texts as a group
    const selection = new fabric.ActiveSelection(texts, {
        canvas: canvas,
    })
    canvas.setActiveObject(selection)
    canvas.renderAll()

    return texts
}

/**
 * Actualiza las propiedades del flexbox y reorganiza los textos
 */
export const updateFlexboxProperty = (
    canvas: fabric.Canvas,
    selectedObject: fabric.FabricObject,
    property: string,
    value: any
) => {
    const flexboxId = (selectedObject as any).flexboxId
    if (!flexboxId) return

    // Get current direction and gap from selected object
    let direction = (selectedObject as any).flexboxDirection || 'vertical'
    let gap = (selectedObject as any).flexboxGap || 20

    // Update the property
    if (property === 'direction') {
        direction = value
    } else if (property === 'gap') {
        gap = value
    }

    // Re-layout all texts in this flexbox
    layoutFlexboxTexts(canvas, flexboxId, direction, gap)
}

/**
 * Agrega un nuevo texto al flexbox
 */
export const addTextToFlexbox = (canvas: fabric.Canvas, selectedObject: fabric.FabricObject) => {
    const flexboxId = (selectedObject as any).flexboxId
    if (!flexboxId) return

    // Get all texts in this flexbox
    const allObjects = canvas.getObjects()
    const flexboxTexts = allObjects.filter(obj =>
        (obj as any).isInFlexbox && (obj as any).flexboxId === flexboxId
    )

    const direction = (selectedObject as any).flexboxDirection || 'vertical'
    const gap = (selectedObject as any).flexboxGap || 20
    const newIndex = flexboxTexts.length

    // Create new text
    const newText = new fabric.Textbox(`Texto ${newIndex + 1}`, {
        fontSize: 24,
        fill: '#000000',
        fontFamily: 'Arial',
        width: 400,
        editable: true,
        left: selectedObject.left || 100,
        top: (selectedObject.top || 100) + 100,
        hasControls: true,
        hasBorders: true,
    })

    // Mark as part of flexbox
    ;(newText as any).isInFlexbox = true
    ;(newText as any).flexboxId = flexboxId
    ;(newText as any).flexboxIndex = newIndex
    ;(newText as any).flexboxDirection = direction
    ;(newText as any).flexboxGap = gap

    canvas.add(newText)

    // Re-layout
    layoutFlexboxTexts(canvas, flexboxId, direction, gap)

    canvas.setActiveObject(newText)
    canvas.renderAll()
}

/**
 * Elimina el último texto del flexbox
 */
export const removeTextFromFlexbox = (canvas: fabric.Canvas, selectedObject: fabric.FabricObject) => {
    const flexboxId = (selectedObject as any).flexboxId
    if (!flexboxId) return

    // Get all texts in this flexbox
    const allObjects = canvas.getObjects()
    const flexboxTexts = allObjects.filter(obj =>
        (obj as any).isInFlexbox && (obj as any).flexboxId === flexboxId
    ).sort((a, b) => ((a as any).flexboxIndex || 0) - ((b as any).flexboxIndex || 0))

    // Don't remove if there's only one text left
    if (flexboxTexts.length <= 1) return

    // Remove last text
    const lastText = flexboxTexts[flexboxTexts.length - 1]
    canvas.remove(lastText)

    const direction = (selectedObject as any).flexboxDirection || 'vertical'
    const gap = (selectedObject as any).flexboxGap || 20

    // Re-layout remaining texts
    layoutFlexboxTexts(canvas, flexboxId, direction, gap)
    canvas.renderAll()
}
