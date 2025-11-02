/**
 * Properties Sidebar - Barra lateral de propiedades
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
                        <Label className="text-xs text-zinc-300 mb-2 block font-medium">Color de fondo</Label>
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
                            {selectedObject.type === 'i-text' || selectedObject.type === 'text' || selectedObject.type === 'textbox' ? 'Texto' :
                             selectedObject.type === 'rect' ? 'Rectángulo' :
                             selectedObject.type === 'circle' ? 'Círculo' :
                             selectedObject.type === 'triangle' ? 'Triángulo' :
                             selectedObject.type === 'image' ? 'Imagen' : 'Objeto'}
                        </h4>

                        {/* Text Properties */}
                        {isTextType && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Tamaño</Label>
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
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Fuente</Label>
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
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Peso</Label>
                                    <Select
                                        value={(selectedObject as any).fontWeight || 'normal'}
                                        onValueChange={(value) => onUpdateTextProperty('fontWeight', value)}
                                    >
                                        <SelectTrigger className="h-10 bg-zinc-700 border-zinc-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="normal" className="text-white hover:bg-zinc-700">Normal</SelectItem>
                                            <SelectItem value="bold" className="text-white hover:bg-zinc-700">Negrita</SelectItem>
                                            <SelectItem value="100" className="text-white hover:bg-zinc-700">Thin</SelectItem>
                                            <SelectItem value="300" className="text-white hover:bg-zinc-700">Light</SelectItem>
                                            <SelectItem value="500" className="text-white hover:bg-zinc-700">Medium</SelectItem>
                                            <SelectItem value="700" className="text-white hover:bg-zinc-700">Bold</SelectItem>
                                            <SelectItem value="900" className="text-white hover:bg-zinc-700">Black</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-300 mb-2 block font-medium">Alineación</Label>
                                    <div className="grid grid-cols-4 gap-1">
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'left' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'left')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Alinear a la izquierda"
                                        >
                                            <AlignLeft className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'center' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'center')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Centrar"
                                        >
                                            <AlignCenter className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'right' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'right')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Alinear a la derecha"
                                        >
                                            <AlignRight className="size-4" />
                                        </Button>
                                        <Button
                                            variant={((selectedObject as any).textAlign || 'left') === 'justify' ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => onUpdateTextProperty('textAlign', 'justify')}
                                            className="h-10 text-black hover:text-black border-zinc-600"
                                            title="Justificar"
                                        >
                                            <AlignJustify className="size-4" />
                                        </Button>
                                    </div>
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
                    </div>
                )}

                {!selectedObject && (
                    <div className="text-center text-zinc-400 text-sm py-12 px-4">
                        <p className="leading-relaxed">Selecciona un objeto en el canvas para editar sus propiedades</p>
                    </div>
                )}
            </div>
        </div>
    )
}
