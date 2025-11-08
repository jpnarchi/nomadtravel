/**
 * Parse slides from file objects
 */
export function parseSlidesFromFiles(files: Record<string, string>): any[] {
    console.log('📁 Archivos recibidos:', Object.keys(files))

    const slideFiles = Object.entries(files)
        .filter(([path]) => {
            const isSlide = path.startsWith('/slides/') && path.endsWith('.json')
            console.log(`🔍 Verificando ${path}: ${isSlide}`)
            return isSlide
        })
        .sort((a, b) => {
            // Extract slide number from path (e.g., /slides/slide-5.json -> 5)
            const numA = parseInt(a[0].match(/slide-(\d+)\.json$/)?.[1] || '0')
            const numB = parseInt(b[0].match(/slide-(\d+)\.json$/)?.[1] || '0')
            return numA - numB // Sort numerically instead of alphabetically
        })
        .map(([path, content]) => {
            try {
                console.log(`✅ Parseando ${path}`, content.substring(0, 100))
                const parsed = JSON.parse(content)
                console.log(`✅ Slide parseado:`, parsed)
                return parsed
            } catch (error) {
                console.error(`❌ Error parsing ${path}:`, error)
                return null
            }
        })
        .filter(slide => slide !== null)

    console.log(`🎬 Total slides encontrados: ${slideFiles.length}`)
    console.log(`🎬 Slides:`, slideFiles)

    return slideFiles
}
