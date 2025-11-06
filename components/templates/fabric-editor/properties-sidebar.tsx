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

interface PropertiesSidebarProps {
    selectedObject: fabric.FabricObject | null
    backgroundColor: string
    onBackgroundColorChange: (color: string) => void
    onUpdateTextProperty: (property: string, value: any) => void
    onUpdateFillColor: (color: string) => void
}

export function PropertiesSidebar({
    selectedObject,
    backgroundColor,
    onBackgroundColorChange,
    onUpdateTextProperty,
    onUpdateFillColor,
}: PropertiesSidebarProps) {
    const isTextType = selectedObject &&
        (selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox')

    return (
        <div className="w-64 bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
            <div className="p-4 space-y-4">
                {/* Slide Properties */}
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                    <h4 className="text-xs font-semibold text-white uppercase mb-3 tracking-wide">Slide</h4>
                    <div>
                        <Label className="text-xs text-zinc-300 mb-2 block font-medium">Background color</Label>
                        <Input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => onBackgroundColorChange(e.target.value)}
                            className="h-10 cursor-pointer bg-zinc-700 border-zinc-600 text-white"
                        />
                    </div>
                </div>

                {/* Object Properties */}
                {selectedObject && (
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                        <h4 className="text-xs font-semibold text-white uppercase mb-3 tracking-wide">
                            {selectedObject.type === 'i-text' || selectedObject.type === 'text' || selectedObject.type === 'textbox' ? 'Text' :
                             selectedObject.type === 'rect' ? 'Rectangle' :
                             selectedObject.type === 'circle' ? 'Circle' :
                             selectedObject.type === 'triangle' ? 'Triangle' :
                             selectedObject.type === 'image' ? 'Image' : 'Object'}
                        </h4>

                        {/* Text Properties */}
                        {isTextType && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Size</Label>
                                    <Input
                                        type="number"
                                        value={(selectedObject as any).fontSize || 60}
                                        onChange={(e) => onUpdateTextProperty('fontSize', parseInt(e.target.value))}
                                        className="h-10 bg-zinc-700 border-zinc-600 text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Color</Label>
                                    <Input
                                        type="color"
                                        value={(selectedObject as any).fill as string || '#ffffff'}
                                        onChange={(e) => onUpdateFillColor(e.target.value)}
                                        className="h-10 cursor-pointer bg-zinc-700 border-zinc-600 text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Font</Label>
                                    <Select
                                        value={(selectedObject as any).fontFamily || 'Arial'}
                                        onValueChange={(value) => onUpdateTextProperty('fontFamily', value)}
                                    >
                                        <SelectTrigger className="h-10 bg-zinc-700 border-zinc-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700 max-h-80">
                                            {/* Sans-serif fonts */}
                                            <SelectItem value="Arial" className="text-white hover:bg-zinc-700">Arial</SelectItem>
                                            <SelectItem value="Helvetica" className="text-white hover:bg-zinc-700">Helvetica</SelectItem>
                                            <SelectItem value="Verdana" className="text-white hover:bg-zinc-700">Verdana</SelectItem>
                                            <SelectItem value="Tahoma" className="text-white hover:bg-zinc-700">Tahoma</SelectItem>
                                            <SelectItem value="Trebuchet MS" className="text-white hover:bg-zinc-700">Trebuchet MS</SelectItem>
                                            <SelectItem value="Lucida Sans Unicode" className="text-white hover:bg-zinc-700">Lucida Sans</SelectItem>
                                            <SelectItem value="Impact" className="text-white hover:bg-zinc-700">Impact</SelectItem>
                                            <SelectItem value="Comic Sans MS" className="text-white hover:bg-zinc-700">Comic Sans MS</SelectItem>

                                            {/* Serif fonts */}
                                            <SelectItem value="Times New Roman" className="text-white hover:bg-zinc-700">Times New Roman</SelectItem>
                                            <SelectItem value="Georgia" className="text-white hover:bg-zinc-700">Georgia</SelectItem>
                                            <SelectItem value="Garamond" className="text-white hover:bg-zinc-700">Garamond</SelectItem>
                                            <SelectItem value="Palatino Linotype" className="text-white hover:bg-zinc-700">Palatino</SelectItem>
                                            <SelectItem value="Book Antiqua" className="text-white hover:bg-zinc-700">Book Antiqua</SelectItem>

                                            {/* Monospace fonts */}
                                            <SelectItem value="Courier New" className="text-white hover:bg-zinc-700">Courier New</SelectItem>
                                            <SelectItem value="Consolas" className="text-white hover:bg-zinc-700">Consolas</SelectItem>
                                            <SelectItem value="Monaco" className="text-white hover:bg-zinc-700">Monaco</SelectItem>
                                            <SelectItem value="Lucida Console" className="text-white hover:bg-zinc-700">Lucida Console</SelectItem>

                                            {/* Modern web fonts */}
                                            <SelectItem value="Roboto" className="text-white hover:bg-zinc-700">Roboto</SelectItem>
                                            <SelectItem value="Open Sans" className="text-white hover:bg-zinc-700">Open Sans</SelectItem>
                                            <SelectItem value="Montserrat" className="text-white hover:bg-zinc-700">Montserrat</SelectItem>
                                            <SelectItem value="Poppins" className="text-white hover:bg-zinc-700">Poppins</SelectItem>
                                            <SelectItem value="Lato" className="text-white hover:bg-zinc-700">Lato</SelectItem>
                                            <SelectItem value="Inter" className="text-white hover:bg-zinc-700">Inter</SelectItem>
                                            <SelectItem value="Raleway" className="text-white hover:bg-zinc-700">Raleway</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Weight</Label>
                                    <Select
                                        value={(selectedObject as any).fontWeight || 'normal'}
                                        onValueChange={(value) => onUpdateTextProperty('fontWeight', value)}
                                    >
                                        <SelectTrigger className="h-10 bg-zinc-700 border-zinc-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="normal" className="text-white hover:bg-zinc-700">Normal</SelectItem>
                                            <SelectItem value="bold" className="text-white hover:bg-zinc-700">Bold</SelectItem>
                                            <SelectItem value="100" className="text-white hover:bg-zinc-700">Thin</SelectItem>
                                            <SelectItem value="300" className="text-white hover:bg-zinc-700">Light</SelectItem>
                                            <SelectItem value="500" className="text-white hover:bg-zinc-700">Medium</SelectItem>
                                            <SelectItem value="700" className="text-white hover:bg-zinc-700">Bold</SelectItem>
                                            <SelectItem value="900" className="text-white hover:bg-zinc-700">Black</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Alignment</Label>
                                    <div className="grid grid-cols-4 gap-1">
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'left' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'left')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Align left"
                                        >
                                            <AlignLeft className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'center' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'center')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Center"
                                        >
                                            <AlignCenter className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'right' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'right')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Align right"
                                        >
                                            <AlignRight className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'justify' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'justify')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Justify"
                                        >
                                            <AlignJustify className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Line height</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0.5"
                                        max="3"
                                        value={(selectedObject as any).lineHeight || 1.16}
                                        onChange={(e) => onUpdateTextProperty('lineHeight', parseFloat(e.target.value))}
                                        className="h-10 bg-zinc-700 border-zinc-600 text-white"
                                    />
                                    <p className="text-[10px] text-zinc-400 mt-1">1.0 = single spacing, 1.5 = 1.5x spacing</p>
                                </div>
                            </div>
                        )}

                        {/* Shape Fill Color */}
                        {selectedObject &&
                            selectedObject.type !== 'text' &&
                            selectedObject.type !== 'i-text' &&
                            selectedObject.type !== 'textbox' &&
                            selectedObject.type !== 'image' && (
                            <div>
                                <Label className="text-xs text-zinc-300 mb-2 block font-medium">Color</Label>
                                <Input
                                    type="color"
                                    value={(selectedObject as any).fill as string || '#667eea'}
                                    onChange={(e) => onUpdateFillColor(e.target.value)}
                                    className="h-10 cursor-pointer bg-zinc-700 border-zinc-600 text-white"
                                />
                            </div>
                        )}

                        {/* Opacity Control - Available for all objects */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-zinc-300 font-medium">Opacity</Label>
                                <span className="text-xs text-zinc-400 font-medium">
                                    {Math.round(((selectedObject as any).opacity ?? 1) * 100)}%
                                </span>
                            </div>
                            <Input
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
                    <div className="text-center text-zinc-400 text-sm py-12 px-4">
                        <p className="leading-relaxed">Select an object on the canvas to edit its properties</p>
                    </div>
                )}
            </div>
        </div>
    )
}
