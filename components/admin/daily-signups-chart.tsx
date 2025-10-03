'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar, Download } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface DailySignupData {
    _id: string
    date: string
    count: number
}

export function DailySignupsChart() {
    const [startDate, setStartDate] = useState<string>(() => {
        // Por defecto últimos 30 días
        return format(subDays(new Date(), 30), 'yyyy-MM-dd')
    })
    const [endDate, setEndDate] = useState<string>(() => {
        return format(new Date(), 'yyyy-MM-dd')
    })
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const dailySignups = useQuery(api.users.getDailySignups, {
        startDate,
        endDate
    })

    const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setStartDate(value)
        } else {
            setEndDate(value)
        }
    }

    const handleQuickRange = (days: number) => {
        const end = new Date()
        const start = subDays(end, days)
        setStartDate(format(start, 'yyyy-MM-dd'))
        setEndDate(format(end, 'yyyy-MM-dd'))
    }

    const exportData = () => {
        if (!dailySignups) return

        const csvContent = [
            'Fecha,Registros',
            ...dailySignups.map(item => `${item.date},${item.count}`)
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `registros-diarios-${startDate}-a-${endDate}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const totalSignups = dailySignups?.reduce((sum, item) => sum + item.count, 0) || 0
    const averageSignups = dailySignups?.length ? Math.round(totalSignups / dailySignups.length * 10) / 10 : 0

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                            Registros Diarios
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Rastrea los registros de usuarios a lo largo del tiempo
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportData}
                        disabled={!dailySignups?.length}
                        className="flex items-center gap-2 w-full sm:w-auto"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                        <span className="sm:hidden">Exportar</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Controles de Rango de Fechas */}
                <div className="space-y-4">
                    {/* Date Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Fecha de Inicio</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                max={endDate}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Fecha de Fin</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                min={startDate}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Quick Range Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickRange(7)}
                            className="flex-1 sm:flex-none min-w-0"
                        >
                            <span className="hidden sm:inline">Últimos 7 días</span>
                            <span className="sm:hidden">7d</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickRange(30)}
                            className="flex-1 sm:flex-none min-w-0"
                        >
                            <span className="hidden sm:inline">Últimos 30 días</span>
                            <span className="sm:hidden">30d</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickRange(90)}
                            className="flex-1 sm:flex-none min-w-0"
                        >
                            <span className="hidden sm:inline">Últimos 90 días</span>
                            <span className="sm:hidden">90d</span>
                        </Button>
                    </div>
                </div>

                {/* Estadísticas Resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">{totalSignups}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total de Registros</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">{averageSignups}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Promedio por Día</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">{dailySignups?.length || 0}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Días con Datos</div>
                    </div>
                </div>

                {/* Gráfico */}
                <div className="h-64 sm:h-80 w-full">
                    {dailySignups && dailySignups.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={dailySignups}
                                margin={{
                                    top: 20,
                                    right: isMobile ? 10 : 30,
                                    left: isMobile ? 10 : 20,
                                    bottom: isMobile ? 60 : 5
                                }}
                            >
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => {
                                        // Parse date as local date to avoid timezone issues
                                        const [year, month, day] = value.split('-').map(Number)
                                        const date = new Date(year, month - 1, day)
                                        return isMobile
                                            ? format(date, 'MM/dd')
                                            : format(date, 'MMM dd')
                                    }}
                                    angle={isMobile ? -90 : -45}
                                    textAnchor="end"
                                    height={isMobile ? 100 : 80}
                                    fontSize={isMobile ? 10 : 12}
                                />
                                <YAxis
                                    fontSize={isMobile ? 10 : 12}
                                    width={isMobile ? 30 : 40}
                                />
                                <Tooltip
                                    labelFormatter={(value) => {
                                        // Parse date as local date to avoid timezone issues
                                        const [year, month, day] = value.split('-').map(Number)
                                        const date = new Date(year, month - 1, day)
                                        return format(date, 'MMMM dd, yyyy')
                                    }}
                                    formatter={(value: number) => [value, 'Registros']}
                                    contentStyle={{
                                        fontSize: isMobile ? '12px' : '14px',
                                        padding: isMobile ? '8px' : '12px',
                                        backgroundColor: '#000000',
                                        color: '#ffffff',
                                        border: '1px solid #374151',
                                        borderRadius: '6px'
                                    }}
                                    labelStyle={{
                                        color: '#ffffff'
                                    }}
                                    wrapperStyle={{
                                        outline: 'none'
                                    }}
                                    cursor={{
                                        fill: 'transparent'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#16a34a"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm sm:text-base px-4">
                            {dailySignups === undefined ? 'Cargando...' : 'No hay datos disponibles para el rango de fechas seleccionado'}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
