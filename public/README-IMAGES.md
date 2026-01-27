# Imágenes necesarias para Nomad Travel

Para completar la configuración del branding de Nomad Travel, necesitas agregar las siguientes imágenes en la carpeta `/public`:

## 📋 Lista de archivos requeridos

### 1. **banner.png** (REQUERIDO)
- **Uso:** Se muestra cuando compartes el sitio en redes sociales (Facebook, Twitter, LinkedIn, etc.)
- **Tamaño recomendado:** 1200x630 píxeles
- **Ubicación:** `/public/banner.png`
- **Formato:** PNG o JPG
- **Contenido sugerido:** Logo de Nomad Travel + texto descriptivo o imagen representativa de la agencia

### 2. **logo.svg** (REQUERIDO)
- **Uso:** Favicon del sitio (icono que aparece en la pestaña del navegador)
- **Tamaño:** Vector (SVG) - se adapta automáticamente
- **Ubicación:** `/public/logo.svg`
- **Formato:** SVG
- **Contenido:** Logo de Nomad Travel simplificado

### 3. **logo-192.png** (OPCIONAL - para PWA)
- **Uso:** Icono de app cuando se instala en dispositivos móviles
- **Tamaño:** 192x192 píxeles
- **Ubicación:** `/public/logo-192.png`
- **Formato:** PNG con fondo transparente o del color de tu marca

### 4. **logo-512.png** (OPCIONAL - para PWA)
- **Uso:** Icono de app en alta resolución
- **Tamaño:** 512x512 píxeles
- **Ubicación:** `/public/logo-512.png`
- **Formato:** PNG con fondo transparente o del color de tu marca

## 🎨 Guía de diseño

### Colores de la marca (ya configurados):
- **Verde principal:** `#2D4629` (--nomad-green)
- **Dorado:** `#D4AF37` (--luxury-gold)
- **Fondo claro:** `#fafaf9`

### Ejemplo de banner.png:
```
┌─────────────────────────────────────┐
│                                     │
│     [Logo Nomad Travel]             │
│                                     │
│   Nomad Travel Society              │
│   Luxury Travel CRM                 │
│                                     │
│   [Imagen de fondo de viajes]       │
│                                     │
└─────────────────────────────────────┘
```

## ✅ Verificación

Una vez que agregues las imágenes:

1. Verifica que el favicon cambie en el navegador (recarga con Ctrl+Shift+R o Cmd+Shift+R)
2. Comparte el link en redes sociales para ver el banner
3. Puedes usar herramientas como [OpenGraph Preview](https://www.opengraph.xyz/) para verificar cómo se verá

## 📝 Notas

- Los archivos deben estar directamente en `/public` (no en subcarpetas)
- Si no tienes logo.svg, puedes usar logo.png temporalmente (cambia en index.html)
- Los archivos PWA (192 y 512) son opcionales pero recomendados para mejor experiencia móvil
