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
 * Reorganiza los textos y el fondo del flexbox
 */
export const layoutFlexbox = (canvas: fabric.Canvas, flexboxId: string) => {
    // Get all objects in this flexbox (background + texts)
    const allObjects = canvas.getObjects()
    const flexboxObjects = allObjects.filter(obj =>
        (obj as any).flexboxId === flexboxId
    )

    if (flexboxObjects.length === 0) return

    // Find the background rect
    const background = flexboxObjects.find(obj => (obj as any).isFlexboxBackground) as fabric.Rect
    if (!background) return

    const props = (background as any).flexboxProps || {}
    const direction = props.direction || 'vertical'
    const gap = props.gap || 10
    const padding = props.padding || 20
    const align = props.align || 'start'
    const containerWidth = (background as any).containerWidth || 600
    const containerHeight = (background as any).containerHeight || 400

    // Get all text objects (not the background)
    const textObjects = flexboxObjects.filter(obj =>
        !((obj as any).isFlexboxBackground)
    ).sort((a, b) => ((a as any).flexboxIndex || 0) - ((b as any).flexboxIndex || 0)) as fabric.Textbox[]

    if (textObjects.length === 0) return

    // Get background position
    const bgLeft = background.left || 100
    const bgTop = background.top || 100

    // Calculate total size needed
    let totalTextHeight = 0
    textObjects.forEach(text => {
        totalTextHeight += (text.height || 40) * (text.scaleY || 1)
    })
    totalTextHeight += gap * (textObjects.length - 1)

    // Starting position
    const startX = bgLeft + padding
    let startY = bgTop + padding

    // Adjust for alignment
    if (direction === 'vertical' && align === 'center') {
        startY = bgTop + (containerHeight - totalTextHeight) / 2
    } else if (direction === 'vertical' && align === 'end') {
        startY = bgTop + containerHeight - padding - totalTextHeight
    }

    // Position each text
    let currentY = startY
    let currentX = startX

    textObjects.forEach((text) => {
        const textHeight = (text.height || 40) * (text.scaleY || 1)
        const textWidth = (text.width || 200) * (text.scaleX || 1)

        if (direction === 'vertical') {
            text.set({
                left: startX,
                top: currentY,
            })
            currentY += textHeight + gap
        } else {
            text.set({
                left: currentX,
                top: startY,
            })
            currentX += textWidth + gap
        }

        text.setCoords()
    })

    // Update background
    background.set({
        width: containerWidth,
        height: containerHeight,
        fill: props.backgroundColor || '#f0f0f0',
        rx: props.borderRadius || 8,
        ry: props.borderRadius || 8,
    })
    background.setCoords()

    canvas.renderAll()
}

/**
 * Crea un TextFlexbox - Rectángulo de fondo con textos independientes pero vinculados
 */
export const createTextFlexbox = (canvas: fabric.Canvas, options?: TextFlexboxOptions) => {
    const props = {
        direction: options?.direction || 'vertical',
        gap: options?.gap || 10,
        padding: options?.padding || 20,
        backgroundColor: options?.backgroundColor || '#f0f0f0',
        borderRadius: options?.borderRadius || 8,
        align: options?.align || 'start',
    }

    const containerWidth = options?.width || 600
    const containerHeight = options?.height || 400
    const startLeft = 100
    const startTop = 100

    // Generate unique flexbox ID
    const flexboxId = `flexbox_${Date.now()}`

    // Create background rectangle
    const background = new fabric.Rect({
        width: containerWidth,
        height: containerHeight,
        fill: props.backgroundColor,
        rx: props.borderRadius,
        ry: props.borderRadius,
        left: startLeft,
        top: startTop,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: false,
    })

    // Store custom properties on background
    ;(background as any).isFlexboxBackground = true
    ;(background as any).flexboxId = flexboxId
    ;(background as any).flexboxProps = props
    ;(background as any).containerWidth = containerWidth
    ;(background as any).containerHeight = containerHeight

    canvas.add(background)

    // Create text objects as separate objects
    const texts: fabric.Textbox[] = []
    for (let i = 0; i < 2; i++) {
        const text = new fabric.Textbox(i === 0 ? 'Título' : 'Párrafo', {
            fontSize: i === 0 ? 32 : 18,
            fill: '#000000',
            fontFamily: 'Arial',
            fontWeight: i === 0 ? 'bold' : 'normal',
            width: containerWidth - (props.padding * 2),
            editable: true,
            left: startLeft + props.padding,
            top: startTop + props.padding + (i * 60),
            selectable: true,
            hasControls: false, // No individual controls
            hasBorders: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
        })

        // Mark as part of flexbox
        ;(text as any).flexboxId = flexboxId
        ;(text as any).flexboxIndex = i

        texts.push(text)
        canvas.add(text)
    }

    // Send background to back
    canvas.sendObjectToBack(background)

    // Layout all objects
    layoutFlexbox(canvas, flexboxId)

    // Select the background
    canvas.setActiveObject(background)
    canvas.renderAll()

    return background
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
    if (!(selectedObject as any).isFlexboxBackground) return

    const flexboxId = (selectedObject as any).flexboxId
    if (!flexboxId) return

    const props = (selectedObject as any).flexboxProps || {}

    // Update the property
    props[property] = value

    // Store updated props
    ;(selectedObject as any).flexboxProps = props

    // Re-layout
    layoutFlexbox(canvas, flexboxId)
}

/**
 * Agrega un nuevo texto al flexbox
 */
export const addTextToFlexbox = (canvas: fabric.Canvas, selectedObject: fabric.FabricObject) => {
    if (!(selectedObject as any).isFlexboxBackground) return

    const flexboxId = (selectedObject as any).flexboxId
    if (!flexboxId) return

    // Get all texts in this flexbox
    const allObjects = canvas.getObjects()
    const flexboxTexts = allObjects.filter(obj =>
        (obj as any).flexboxId === flexboxId && !(obj as any).isFlexboxBackground
    )

    const props = (selectedObject as any).flexboxProps || {}
    const containerWidth = (selectedObject as any).containerWidth || 600
    const newIndex = flexboxTexts.length

    // Create new text
    const newText = new fabric.Textbox(`Texto ${newIndex + 1}`, {
        fontSize: 18,
        fill: '#000000',
        fontFamily: 'Arial',
        width: containerWidth - ((props.padding || 20) * 2),
        editable: true,
        left: selectedObject.left || 100,
        top: (selectedObject.top || 100) + 100,
        selectable: true,
        hasControls: false,
        hasBorders: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
    })

    // Mark as part of flexbox
    ;(newText as any).flexboxId = flexboxId
    ;(newText as any).flexboxIndex = newIndex

    canvas.add(newText)

    // Re-layout
    layoutFlexbox(canvas, flexboxId)
}

/**
 * Elimina el último texto del flexbox
 */
export const removeTextFromFlexbox = (canvas: fabric.Canvas, selectedObject: fabric.FabricObject) => {
    if (!(selectedObject as any).isFlexboxBackground) return

    const flexboxId = (selectedObject as any).flexboxId
    if (!flexboxId) return

    // Get all texts in this flexbox
    const allObjects = canvas.getObjects()
    const flexboxTexts = allObjects.filter(obj =>
        (obj as any).flexboxId === flexboxId && !(obj as any).isFlexboxBackground
    ).sort((a, b) => ((a as any).flexboxIndex || 0) - ((b as any).flexboxIndex || 0))

    // Don't remove if there's only one text left
    if (flexboxTexts.length <= 1) return

    // Remove last text
    const lastText = flexboxTexts[flexboxTexts.length - 1]
    canvas.remove(lastText)

    // Re-layout
    layoutFlexbox(canvas, flexboxId)
}
