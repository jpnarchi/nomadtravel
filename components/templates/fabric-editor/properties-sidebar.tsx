/**
 * Properties Sidebar
 */

import * as fabric from 'fabric'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify
} from 'lucide-react'

// Custom styles for circular color pickers
const colorPickerStyles = `
    .circular-color-picker {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border: none;
        background: transparent;
    }
    .circular-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
        border-radius: 50%;
    }
    .circular-color-picker::-webkit-color-swatch {
        border: none;
        border-radius: 50%;
    }
    .circular-color-picker::-moz-color-swatch {
        border: none;
        border-radius: 50%;
    }
`

interface PropertiesSidebarProps {
    selectedObject: fabric.FabricObject | null
    backgroundColor: string
    onBackgroundColorChange: (color: string) => void
    onUpdateTextProperty: (property: string, value: any) => void
    onUpdateFillColor: (color: string) => void
    onUpdateBorderRadius?: (radius: number) => void
    onUpdateStrokeColor?: (color: string) => void
    onUpdateStrokeWidth?: (width: number) => void
    onUpdateRingThickness?: (thickness: number) => void
    onUpdateFlexboxProperty?: (property: string, value: any) => void
    onAddTextToFlexbox?: () => void
    onRemoveTextFromFlexbox?: () => void
}

export function PropertiesSidebar({
    selectedObject,
    backgroundColor,
    onBackgroundColorChange,
    onUpdateTextProperty,
    onUpdateFillColor,
    onUpdateBorderRadius,
    onUpdateStrokeColor,
    onUpdateStrokeWidth,
    onUpdateRingThickness,
    onUpdateFlexboxProperty,
    onAddTextToFlexbox,
    onRemoveTextFromFlexbox,
}: PropertiesSidebarProps) {
    const isTextType = selectedObject &&
        (selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox')

    const isImagePlaceholder = selectedObject && (selectedObject as any).isImagePlaceholder
    const isImageContainer = selectedObject && (selectedObject as any).isImageContainer
    const isRing = selectedObject && (selectedObject as any).isRing
    const isTextFlexbox = selectedObject && (selectedObject as any).isTextFlexbox

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: colorPickerStyles }} />
            <div className="w-72 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 overflow-y-auto shadow-inner">
                <div className="p-5 space-y-4">
                {/* Slide Properties */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h4 className="text-xs font-bold text-gray-800 uppercase mb-4 tracking-wider">Slide</h4>
                    <div>
                        <Label className="text-xs text-gray-700 mb-2 block font-medium">Background color</Label>
                        <div className="relative w-14 h-14 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => onBackgroundColorChange(e.target.value)}
                                className="circular-color-picker w-14 h-14 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Object Properties */}
                {selectedObject && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <h4 className="text-xs font-bold text-gray-800 uppercase mb-4 tracking-wider">
                            {selectedObject.type === 'i-text' || selectedObject.type === 'text' || selectedObject.type === 'textbox' ? 'Text' :
                             isTextFlexbox ? 'Text Flexbox' :
                             isRing ? 'Ring' :
                             selectedObject.type === 'rect' ? 'Rectangle' :
                             selectedObject.type === 'circle' ? 'Circle' :
                             selectedObject.type === 'triangle' ? 'Triangle' :
                             selectedObject.type === 'image' ? 'Image' : 'Object'}
                        </h4>

                        {/* Text Properties */}
                        {isTextType && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-gray-700 mb-2 block font-medium">Size</Label>
                                    <Input
                                        type="number"
                                        value={(selectedObject as any).fontSize || 60}
                                        onChange={(e) => onUpdateTextProperty('fontSize', parseInt(e.target.value))}
                                        className="h-10 bg-white border-gray-200 text-gray-900 rounded-lg shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-700 mb-2 block font-medium">Color</Label>
                                    <div className="relative w-14 h-14 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                                        <input
                                            type="color"
                                            value={(selectedObject as any).fill as string || '#ffffff'}
                                            onChange={(e) => onUpdateFillColor(e.target.value)}
                                            className="circular-color-picker w-14 h-14 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-gray-700 mb-2 block font-medium">Font</Label>
                                        <Select
                                            value={(selectedObject as any).fontFamily || 'Arial'}
                                            onValueChange={(value) => onUpdateTextProperty('fontFamily', value)}
                                        >
                                            <SelectTrigger className="h-10 bg-white border-gray-200 text-gray-900 rounded-lg shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-gray-200 max-h-80 rounded-lg shadow-lg">
                                                {/* Sans-serif fonts */}
                                                <SelectItem value="Arial" className="text-gray-900 hover:bg-gray-100">Arial</SelectItem>
                                                <SelectItem value="Helvetica" className="text-gray-900 hover:bg-gray-100">Helvetica</SelectItem>
                                                <SelectItem value="Verdana" className="text-gray-900 hover:bg-gray-100">Verdana</SelectItem>
                                                <SelectItem value="Tahoma" className="text-gray-900 hover:bg-gray-100">Tahoma</SelectItem>
                                                <SelectItem value="Trebuchet MS" className="text-gray-900 hover:bg-gray-100">Trebuchet MS</SelectItem>
                                                <SelectItem value="Lucida Sans Unicode" className="text-gray-900 hover:bg-gray-100">Lucida Sans</SelectItem>
                                                <SelectItem value="Impact" className="text-gray-900 hover:bg-gray-100">Impact</SelectItem>
                                                <SelectItem value="Comic Sans MS" className="text-gray-900 hover:bg-gray-100">Comic Sans MS</SelectItem>

                                                {/* Serif fonts */}
                                                <SelectItem value="Times New Roman" className="text-gray-900 hover:bg-gray-100">Times New Roman</SelectItem>
                                                <SelectItem value="Georgia" className="text-gray-900 hover:bg-gray-100">Georgia</SelectItem>
                                                <SelectItem value="Garamond" className="text-gray-900 hover:bg-gray-100">Garamond</SelectItem>
                                                <SelectItem value="Palatino Linotype" className="text-gray-900 hover:bg-gray-100">Palatino</SelectItem>
                                                <SelectItem value="Book Antiqua" className="text-gray-900 hover:bg-gray-100">Book Antiqua</SelectItem>

                                                {/* Monospace fonts */}
                                                <SelectItem value="Courier New" className="text-gray-900 hover:bg-gray-100">Courier New</SelectItem>
                                                <SelectItem value="Consolas" className="text-gray-900 hover:bg-gray-100">Consolas</SelectItem>
                                                <SelectItem value="Monaco" className="text-gray-900 hover:bg-gray-100">Monaco</SelectItem>
                                                <SelectItem value="Lucida Console" className="text-gray-900 hover:bg-gray-100">Lucida Console</SelectItem>

                                                {/* Modern web fonts */}
                                                <SelectItem value="Roboto" className="text-gray-900 hover:bg-gray-100">Roboto</SelectItem>
                                                <SelectItem value="Open Sans" className="text-gray-900 hover:bg-gray-100">Open Sans</SelectItem>
                                                <SelectItem value="Montserrat" className="text-gray-900 hover:bg-gray-100">Montserrat</SelectItem>
                                                <SelectItem value="Poppins" className="text-gray-900 hover:bg-gray-100">Poppins</SelectItem>
                                                <SelectItem value="Lato" className="text-gray-900 hover:bg-gray-100">Lato</SelectItem>
                                                <SelectItem value="Inter" className="text-gray-900 hover:bg-gray-100">Inter</SelectItem>
                                                <SelectItem value="Raleway" className="text-gray-900 hover:bg-gray-100">Raleway</SelectItem>

                                                {/* Custom fonts */}
                                                <SelectItem value="The Seasons" className="text-gray-900 hover:bg-gray-100">The Seasons</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-700 mb-2 block font-medium">Weight</Label>
                                        <Select
                                            value={(selectedObject as any).fontWeight || 'normal'}
                                            onValueChange={(value) => onUpdateTextProperty('fontWeight', value)}
                                        >
                                            <SelectTrigger className="h-10 bg-white border-gray-200 text-gray-900 rounded-lg shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                                                <SelectItem value="normal" className="text-gray-900 hover:bg-gray-100">Normal</SelectItem>
                                                <SelectItem value="bold" className="text-gray-900 hover:bg-gray-100">Bold</SelectItem>
                                                <SelectItem value="100" className="text-gray-900 hover:bg-gray-100">Thin</SelectItem>
                                                <SelectItem value="300" className="text-gray-900 hover:bg-gray-100">Light</SelectItem>
                                                <SelectItem value="500" className="text-gray-900 hover:bg-gray-100">Medium</SelectItem>
                                                <SelectItem value="700" className="text-gray-900 hover:bg-gray-100">Bold</SelectItem>
                                                <SelectItem value="900" className="text-gray-900 hover:bg-gray-100">Black</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-700 mb-2 block font-medium">Alignment</Label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'left' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'left')}
                                            className="h-10 text-gray-900 hover:text-gray-700 border-gray-200 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                                            title="Align left"
                                        >
                                            <AlignLeft className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'center' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'center')}
                                            className="h-10 text-gray-900 hover:text-gray-700 border-gray-200 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                                            title="Center"
                                        >
                                            <AlignCenter className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'right' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'right')}
                                            className="h-10 text-gray-900 hover:text-gray-700 border-gray-200 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                                            title="Align right"
                                        >
                                            <AlignRight className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'justify' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'justify')}
                                            className="h-10 text-gray-900 hover:text-gray-700 border-gray-200 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                                            title="Justify"
                                        >
                                            <AlignJustify className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-gray-700 mb-2 block font-medium">Line height</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0.5"
                                            max="3"
                                            value={(selectedObject as any).lineHeight || 1.16}
                                            onChange={(e) => onUpdateTextProperty('lineHeight', parseFloat(e.target.value))}
                                            className="h-10 bg-white border-gray-200 text-gray-900 rounded-lg shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-700 mb-2 block font-medium">List style</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const currentStyle = (selectedObject as any).listStyle || 'bullets'
                                                const styles = ['none', 'bullets', 'numbers']
                                                const currentIndex = styles.indexOf(currentStyle)
                                                const nextStyle = styles[(currentIndex + 1) % styles.length]
                                                onUpdateTextProperty('listStyle', nextStyle)
                                            }}
                                            className="w-full h-10 bg-white border-gray-200 text-gray-900 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-1"
                                        >
                                            {(() => {
                                                const currentStyle = (selectedObject as any).listStyle || 'bullets'
                                                switch (currentStyle) {
                                                    case 'none':
                                                        return (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11.75 5.25h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5z" />
                                                            </svg>
                                                        )
                                                    case 'bullets':
                                                        return (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M11.75 5.25h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zM6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                                                            </svg>
                                                        )
                                                    case 'numbers':
                                                        return (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M11.75 5.25h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zM5.69 8V4.07h-.06l-1.21.84v-.96l1.28-.88h1.02V8H5.7zm-1.25 3.04c0-.95.73-1.6 1.8-1.6 1.03 0 1.75.6 1.75 1.44 0 .54-.3 1-1.15 1.8l-.94.9v.06h2.16v.86H4.5v-.72l1.6-1.58c.7-.67.88-.93.88-1.25 0-.4-.32-.68-.78-.68-.47 0-.8.32-.8.77v.02h-.96v-.02zm1.26 7.82v-.77h.6c.47 0 .79-.27.79-.68 0-.4-.3-.64-.79-.64-.48 0-.8.27-.82.7h-.96c.04-.94.73-1.53 1.8-1.53 1.02 0 1.75.56 1.75 1.33 0 .57-.36 1.02-.91 1.13v.06c.67.08 1.1.53 1.1 1.18 0 .86-.81 1.49-1.94 1.49-1.1 0-1.84-.61-1.89-1.54h.99c.03.42.38.68.91.68.52 0 .88-.3.88-.71 0-.43-.34-.7-.9-.7h-.6z" />
                                                            </svg>
                                                        )
                                                    default:
                                                        return (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M11.75 5.25h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zm0 6h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 1 1 0-1.5zM6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                                                            </svg>
                                                        )
                                                }
                                            })()}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Text Flexbox Properties */}
                        {isTextFlexbox && onUpdateFlexboxProperty && (
                            <div className="space-y-3">
                                {/* Direction */}
                                <div>
                                    <Label className="text-xs text-gray-700 mb-2 block font-medium">Direction</Label>
                                    <Select
                                        value={(selectedObject as any).flexboxProps?.direction || 'vertical'}
                                        onValueChange={(value) => onUpdateFlexboxProperty('direction', value)}
                                    >
                                        <SelectTrigger className="h-10 bg-white border-gray-200 text-gray-900 rounded-lg shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                                            <SelectItem value="vertical" className="text-gray-900 hover:bg-gray-100">Vertical</SelectItem>
                                            <SelectItem value="horizontal" className="text-gray-900 hover:bg-gray-100">Horizontal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Alignment */}
                                <div>
                                    <Label className="text-xs text-gray-700 mb-2 block font-medium">Alignment</Label>
                                    <Select
                                        value={(selectedObject as any).flexboxProps?.align || 'start'}
                                        onValueChange={(value) => onUpdateFlexboxProperty('align', value)}
                                    >
                                        <SelectTrigger className="h-10 bg-white border-gray-200 text-gray-900 rounded-lg shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                                            <SelectItem value="start" className="text-gray-900 hover:bg-gray-100">Start</SelectItem>
                                            <SelectItem value="center" className="text-gray-900 hover:bg-gray-100">Center</SelectItem>
                                            <SelectItem value="end" className="text-gray-900 hover:bg-gray-100">End</SelectItem>
                                            <SelectItem value="space-between" className="text-gray-900 hover:bg-gray-100">Space Between</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Gap */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-700 font-medium">Gap</Label>
                                        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                            {(selectedObject as any).flexboxProps?.gap || 10}px
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        step="1"
                                        value={(selectedObject as any).flexboxProps?.gap || 10}
                                        onChange={(e) => onUpdateFlexboxProperty('gap', parseInt(e.target.value))}
                                        className="w-full h-2 cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Padding */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-700 font-medium">Padding</Label>
                                        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                            {(selectedObject as any).flexboxProps?.padding || 20}px
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={(selectedObject as any).flexboxProps?.padding || 20}
                                        onChange={(e) => onUpdateFlexboxProperty('padding', parseInt(e.target.value))}
                                        className="w-full h-2 cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Background Color */}
                                <div>
                                    <Label className="text-xs text-gray-700 mb-2 block font-medium">Background Color</Label>
                                    <div className="relative w-14 h-14 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                                        <input
                                            type="color"
                                            value={(selectedObject as any).flexboxProps?.backgroundColor || '#f0f0f0'}
                                            onChange={(e) => onUpdateFlexboxProperty('backgroundColor', e.target.value)}
                                            className="circular-color-picker w-14 h-14 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Border Radius */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-700 font-medium">Border Radius</Label>
                                        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                            {(selectedObject as any).flexboxProps?.borderRadius || 8}px
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        step="1"
                                        value={(selectedObject as any).flexboxProps?.borderRadius || 8}
                                        onChange={(e) => onUpdateFlexboxProperty('borderRadius', parseInt(e.target.value))}
                                        className="w-full h-2 cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Text Management */}
                                <div className="space-y-2 mt-4">
                                    <Label className="text-xs text-gray-700 font-medium">Textos</Label>
                                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                        <p className="text-xs text-gray-600">
                                            {(selectedObject as any)._objects?.length - 1 || 0} texto(s)
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {onAddTextToFlexbox && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={onAddTextToFlexbox}
                                                    className="h-9 bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                                                >
                                                    + Agregar
                                                </Button>
                                            )}
                                            {onRemoveTextFromFlexbox && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={onRemoveTextFromFlexbox}
                                                    className="h-9 bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                                                >
                                                    - Quitar
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            💡 Doble clic en un texto para editarlo
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ring Properties */}
                        {isRing && (
                            <div className="space-y-3">
                                {/* Ring Color (uses stroke, not fill) */}
                                {onUpdateStrokeColor && (
                                    <div>
                                        <Label className="text-xs text-gray-700 mb-2 block font-medium">Ring Color</Label>
                                        <div className="relative w-14 h-14 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                                            <input
                                                type="color"
                                                value={(selectedObject as any).stroke as string || '#fbbf24'}
                                                onChange={(e) => onUpdateStrokeColor(e.target.value)}
                                                className="circular-color-picker w-14 h-14 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Ring Thickness Control */}
                                {onUpdateRingThickness && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-gray-700 font-medium">Ring Thickness</Label>
                                            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                                {Math.round((selectedObject as any).ringThickness ?? 50)}px
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max="200"
                                            step="1"
                                            value={(selectedObject as any).ringThickness ?? 50}
                                            onChange={(e) => onUpdateRingThickness(parseFloat(e.target.value))}
                                            className="w-full h-2 cursor-pointer accent-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Shape Fill Color (not for rings) */}
                        {selectedObject &&
                            !isRing &&
                            selectedObject.type !== 'text' &&
                            selectedObject.type !== 'i-text' &&
                            selectedObject.type !== 'textbox' &&
                            selectedObject.type !== 'image' && (
                            
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs text-gray-700 mb-2 block font-medium">Color</Label>
                                    <div className="relative w-14 h-14 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                                        <input
                                            type="color"
                                            value={(selectedObject as any).fill as string || '#667eea'}
                                            onChange={(e) => onUpdateFillColor(e.target.value)}
                                            className="circular-color-picker w-14 h-14 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Stroke Color Control */}
                                {onUpdateStrokeColor && (
                                    <div>
                                        <Label className="text-xs text-gray-700 mb-2 block font-medium">Border Color</Label>
                                        <div className="relative w-14 h-14 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                                            <input
                                                type="color"
                                                value={(selectedObject as any).stroke as string || '#000000'}
                                                onChange={(e) => onUpdateStrokeColor(e.target.value)}
                                                className="circular-color-picker w-14 h-14 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}
                                </div>

                                {/* Stroke Width Control */}
                                {onUpdateStrokeWidth && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-gray-700 font-medium">Border Width</Label>
                                            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                                {Math.round((selectedObject as any).strokeWidth ?? 0)}px
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            step="1"
                                            value={(selectedObject as any).strokeWidth ?? 0}
                                            onChange={(e) => onUpdateStrokeWidth(parseFloat(e.target.value))}
                                            className="w-full h-2 cursor-pointer accent-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Border Radius Control - Available for image placeholders and containers */}
                        {(isImagePlaceholder || isImageContainer) && onUpdateBorderRadius && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-gray-700 font-medium">Corner Radius</Label>
                                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                        {Math.round((selectedObject as any).borderRadius ?? 0)}px
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={(selectedObject as any).borderRadius ?? 0}
                                    onChange={(e) => onUpdateBorderRadius(parseFloat(e.target.value))}
                                    className="w-full h-2 cursor-pointer accent-blue-500"
                                />
                            </div>
                        )}

                        {/* Opacity Control - Available for all objects */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mt-4">
                                <Label className="text-xs text-gray-700 font-medium">Opacity</Label>
                                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                                    {Math.round(((selectedObject as any).opacity ?? 1) * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={(selectedObject as any).opacity ?? 1}
                                onChange={(e) => onUpdateTextProperty('opacity', parseFloat(e.target.value))}
                                className="w-full h-2 cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>
                )}

                {!selectedObject && (
                    <div className="text-center text-gray-500 text-sm py-16 px-4">
                        <p className="leading-relaxed font-medium">Select an object on the canvas to edit its properties</p>
                    </div>
                )}
            </div>
        </div>
        </>
    )
}
