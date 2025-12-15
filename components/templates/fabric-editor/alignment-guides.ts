/**
 * Alignment Guides - Sistema de guías de alineación y snapping
 */

import * as fabric from 'fabric'

// Configuración
const SNAP_THRESHOLD = 10 // Distancia en píxeles para activar snapping
const GUIDE_COLOR = '#ff4081' // Color de las líneas guía
const GUIDE_WIDTH = 1

// Tipos de alineación
export type AlignmentType =
    | 'left' | 'center' | 'right'  // Horizontal
    | 'top' | 'middle' | 'bottom'   // Vertical

export interface AlignmentGuide {
    type: AlignmentType
    position: number // Coordenada x o y
    isHorizontal: boolean // true = horizontal line, false = vertical line
    snapDistance: number // Distancia al punto de snap
}

export interface ObjectBounds {
    left: number
    right: number
    top: number
    bottom: number
    centerX: number
    centerY: number
    width: number
    height: number
}

/**
 * Calcula los límites de un objeto en el canvas
 */
export function getObjectBounds(obj: fabric.FabricObject): ObjectBounds {
    const coords = obj.aCoords
    if (!coords) {
        // Fallback si no hay coords
        const left = obj.left || 0
        const top = obj.top || 0
        const width = (obj.width || 0) * (obj.scaleX || 1)
        const height = (obj.height || 0) * (obj.scaleY || 1)

        return {
            left,
            right: left + width,
            top,
            bottom: top + height,
            centerX: left + width / 2,
            centerY: top + height / 2,
            width,
            height
        }
    }

    const left = Math.min(coords.tl.x, coords.tr.x, coords.bl.x, coords.br.x)
    const right = Math.max(coords.tl.x, coords.tr.x, coords.bl.x, coords.br.x)
    const top = Math.min(coords.tl.y, coords.tr.y, coords.bl.y, coords.br.y)
    const bottom = Math.max(coords.tl.y, coords.tr.y, coords.bl.y, coords.br.y)

    return {
        left,
        right,
        top,
        bottom,
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2,
        width: right - left,
        height: bottom - top
    }
}

/**
 * Encuentra las guías de alineación del canvas (centro, tercios, bordes)
 */
export function getCanvasAlignmentGuides(canvasWidth: number, canvasHeight: number): AlignmentGuide[] {
    const guides: AlignmentGuide[] = []

    // Líneas verticales
    guides.push({ type: 'left', position: 0, isHorizontal: false, snapDistance: 0 })
    guides.push({ type: 'center', position: canvasWidth / 2, isHorizontal: false, snapDistance: 0 })
    guides.push({ type: 'right', position: canvasWidth, isHorizontal: false, snapDistance: 0 })

    // Tercios verticales
    guides.push({ type: 'left', position: canvasWidth / 3, isHorizontal: false, snapDistance: 0 })
    guides.push({ type: 'right', position: (canvasWidth * 2) / 3, isHorizontal: false, snapDistance: 0 })

    // Líneas horizontales
    guides.push({ type: 'top', position: 0, isHorizontal: true, snapDistance: 0 })
    guides.push({ type: 'middle', position: canvasHeight / 2, isHorizontal: true, snapDistance: 0 })
    guides.push({ type: 'bottom', position: canvasHeight, isHorizontal: true, snapDistance: 0 })

    // Tercios horizontales
    guides.push({ type: 'top', position: canvasHeight / 3, isHorizontal: true, snapDistance: 0 })
    guides.push({ type: 'bottom', position: (canvasHeight * 2) / 3, isHorizontal: true, snapDistance: 0 })

    return guides
}

/**
 * Encuentra guías de alineación basadas en otros objetos en el canvas
 */
export function getObjectAlignmentGuides(
    activeObject: fabric.FabricObject,
    allObjects: fabric.FabricObject[]
): AlignmentGuide[] {
    const guides: AlignmentGuide[] = []
    const activeBounds = getObjectBounds(activeObject)

    allObjects.forEach(obj => {
        if (obj === activeObject) return

        const objBounds = getObjectBounds(obj)

        // Alineaciones verticales (líneas verticales)
        guides.push({
            type: 'left',
            position: objBounds.left,
            isHorizontal: false,
            snapDistance: 0
        })
        guides.push({
            type: 'center',
            position: objBounds.centerX,
            isHorizontal: false,
            snapDistance: 0
        })
        guides.push({
            type: 'right',
            position: objBounds.right,
            isHorizontal: false,
            snapDistance: 0
        })

        // Alineaciones horizontales (líneas horizontales)
        guides.push({
            type: 'top',
            position: objBounds.top,
            isHorizontal: true,
            snapDistance: 0
        })
        guides.push({
            type: 'middle',
            position: objBounds.centerY,
            isHorizontal: true,
            snapDistance: 0
        })
        guides.push({
            type: 'bottom',
            position: objBounds.bottom,
            isHorizontal: true,
            snapDistance: 0
        })
    })

    return guides
}

/**
 * Detecta qué guías están cerca del objeto en movimiento
 */
export function detectActiveGuides(
    activeObject: fabric.FabricObject,
    canvasGuides: AlignmentGuide[],
    objectGuides: AlignmentGuide[],
    threshold: number = SNAP_THRESHOLD
): AlignmentGuide[] {
    const bounds = getObjectBounds(activeObject)
    const activeGuides: AlignmentGuide[] = []
    const allGuides = [...canvasGuides, ...objectGuides]

    // Puntos de referencia del objeto activo
    const checkPoints = {
        vertical: [
            { value: bounds.left, type: 'left' as AlignmentType },
            { value: bounds.centerX, type: 'center' as AlignmentType },
            { value: bounds.right, type: 'right' as AlignmentType }
        ],
        horizontal: [
            { value: bounds.top, type: 'top' as AlignmentType },
            { value: bounds.centerY, type: 'middle' as AlignmentType },
            { value: bounds.bottom, type: 'bottom' as AlignmentType }
        ]
    }

    allGuides.forEach(guide => {
        const points = guide.isHorizontal ? checkPoints.horizontal : checkPoints.vertical

        points.forEach(point => {
            const distance = Math.abs(point.value - guide.position)

            if (distance <= threshold) {
                activeGuides.push({
                    ...guide,
                    snapDistance: distance
                })
            }
        })
    })

    // Eliminar duplicados basados en posición
    const uniqueGuides = activeGuides.filter((guide, index, self) =>
        index === self.findIndex(g =>
            g.position === guide.position && g.isHorizontal === guide.isHorizontal
        )
    )

    // Filtrar guías que están muy cerca unas de otras (menos de 20px de diferencia)
    // Solo mantener la guía más cercana al objeto
    const filteredGuides = filterCloseGuides(uniqueGuides, 20)

    // Limitar a máximo 2 guías (las más relevantes)
    // Ordenar por snapDistance y tomar las 2 más cercanas
    const sortedByRelevance = filteredGuides.sort((a, b) => a.snapDistance - b.snapDistance)
    const maxGuides = sortedByRelevance.slice(0, 2)

    return maxGuides
}

/**
 * Filtra guías que están muy cerca entre sí, manteniendo solo la más cercana
 */
function filterCloseGuides(guides: AlignmentGuide[], minDistance: number): AlignmentGuide[] {
    // Separar guías horizontales y verticales
    const horizontal = guides.filter(g => g.isHorizontal)
    const vertical = guides.filter(g => !g.isHorizontal)

    // Filtrar cada grupo
    const filteredHorizontal = filterGuideGroup(horizontal, minDistance)
    const filteredVertical = filterGuideGroup(vertical, minDistance)

    return [...filteredHorizontal, ...filteredVertical]
}

/**
 * Filtra un grupo de guías (todas horizontales o todas verticales)
 */
function filterGuideGroup(guides: AlignmentGuide[], minDistance: number): AlignmentGuide[] {
    if (guides.length === 0) return guides

    // Ordenar por posición
    const sorted = [...guides].sort((a, b) => a.position - b.position)
    const filtered: AlignmentGuide[] = []

    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i]

        // Verificar si hay alguna guía ya agregada que esté muy cerca
        const hasSimilar = filtered.some(existing =>
            Math.abs(existing.position - current.position) < minDistance
        )

        if (!hasSimilar) {
            filtered.push(current)
        } else {
            // Si ya existe una cercana, mantener la que tiene menor snapDistance
            const existingIndex = filtered.findIndex(existing =>
                Math.abs(existing.position - current.position) < minDistance
            )

            if (existingIndex !== -1 && current.snapDistance < filtered[existingIndex].snapDistance) {
                filtered[existingIndex] = current
            }
        }
    }

    return filtered
}

/**
 * Calcula el ajuste (snap) para aplicar al objeto
 */
export function calculateSnap(
    activeObject: fabric.FabricObject,
    activeGuides: AlignmentGuide[]
): { left?: number; top?: number } {
    const bounds = getObjectBounds(activeObject)
    const snap: { left?: number; top?: number } = {}

    // Encuentra la guía vertical más cercana
    const verticalGuides = activeGuides.filter(g => !g.isHorizontal)
    if (verticalGuides.length > 0) {
        // Ordena por distancia de snap
        verticalGuides.sort((a, b) => a.snapDistance - b.snapDistance)
        const closestVertical = verticalGuides[0]

        // Determina qué parte del objeto snap a la guía
        const leftDistance = Math.abs(bounds.left - closestVertical.position)
        const centerDistance = Math.abs(bounds.centerX - closestVertical.position)
        const rightDistance = Math.abs(bounds.right - closestVertical.position)

        const minDistance = Math.min(leftDistance, centerDistance, rightDistance)

        if (minDistance === leftDistance) {
            // Snap left edge
            snap.left = closestVertical.position
        } else if (minDistance === centerDistance) {
            // Snap center
            snap.left = closestVertical.position - bounds.width / 2
        } else {
            // Snap right edge
            snap.left = closestVertical.position - bounds.width
        }
    }

    // Encuentra la guía horizontal más cercana
    const horizontalGuides = activeGuides.filter(g => g.isHorizontal)
    if (horizontalGuides.length > 0) {
        horizontalGuides.sort((a, b) => a.snapDistance - b.snapDistance)
        const closestHorizontal = horizontalGuides[0]

        const topDistance = Math.abs(bounds.top - closestHorizontal.position)
        const middleDistance = Math.abs(bounds.centerY - closestHorizontal.position)
        const bottomDistance = Math.abs(bounds.bottom - closestHorizontal.position)

        const minDistance = Math.min(topDistance, middleDistance, bottomDistance)

        if (minDistance === topDistance) {
            // Snap top edge
            snap.top = closestHorizontal.position
        } else if (minDistance === middleDistance) {
            // Snap middle
            snap.top = closestHorizontal.position - bounds.height / 2
        } else {
            // Snap bottom edge
            snap.top = closestHorizontal.position - bounds.height
        }
    }

    return snap
}

/**
 * Dibuja las guías de alineación en el canvas
 */
export function drawAlignmentGuides(
    canvas: fabric.Canvas,
    guides: AlignmentGuide[],
    zoom: number = 1
) {
    // Primero limpia las guías anteriores
    clearAlignmentGuides(canvas)

    const canvasWidth = canvas.width! / zoom
    const canvasHeight = canvas.height! / zoom

    guides.forEach(guide => {
        let line: fabric.Line

        if (guide.isHorizontal) {
            // Línea horizontal
            line = new fabric.Line(
                [0, guide.position, canvasWidth, guide.position],
                {
                    stroke: GUIDE_COLOR,
                    strokeWidth: GUIDE_WIDTH / zoom,
                    selectable: false,
                    evented: false,
                    excludeFromExport: true,
                    strokeDashArray: [5 / zoom, 5 / zoom]
                }
            )
        } else {
            // Línea vertical
            line = new fabric.Line(
                [guide.position, 0, guide.position, canvasHeight],
                {
                    stroke: GUIDE_COLOR,
                    strokeWidth: GUIDE_WIDTH / zoom,
                    selectable: false,
                    evented: false,
                    excludeFromExport: true,
                    strokeDashArray: [5 / zoom, 5 / zoom]
                }
            )
        }

        // Marca la línea como guía para poder eliminarla después
        ;(line as any).isAlignmentGuide = true

        // Añade la línea al canvas
        canvas.add(line)

        // Trae la línea al frente para que siempre sea visible
        canvas.bringObjectToFront(line)
    })

    // Renderiza una sola vez al final
    canvas.requestRenderAll()
}

/**
 * Limpia todas las guías de alineación del canvas
 */
export function clearAlignmentGuides(canvas: fabric.Canvas) {
    const objects = canvas.getObjects()
    const guides = objects.filter(obj => (obj as any).isAlignmentGuide)

    guides.forEach(guide => canvas.remove(guide))
}
