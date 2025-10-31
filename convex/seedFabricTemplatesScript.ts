/**
 * Script para poblar templates de Fabric.js
 *
 * INSTRUCCIONES:
 * 1. Ve a https://dashboard.convex.dev
 * 2. Selecciona tu proyecto
 * 3. Ve a "Functions"
 * 4. Busca "seedFabricTemplatesScript:seed"
 * 5. Haz clic en "Run"
 *
 * Esto eliminará templates antiguos y creará los nuevos con Fabric.js
 */

import { internalMutation } from "./_generated/server";

export const seed = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Eliminar todos los templates existentes
        const existingTemplates = await ctx.db.query("templates").collect();
        console.log(`🗑️  Eliminando ${existingTemplates.length} templates antiguos...`);

        for (const template of existingTemplates) {
            // Eliminar archivos del template
            const templateFiles = await ctx.db
                .query("templateFiles")
                .withIndex("by_templateId", (q) => q.eq("templateId", template._id))
                .collect();

            for (const file of templateFiles) {
                await ctx.db.delete(file._id);
            }

            // Eliminar template
            await ctx.db.delete(template._id);
        }

        console.log("✅ Templates antiguos eliminados");

        // 2. Crear template "Pitch Deck Moderno"
        console.log("📦 Creando template: Pitch Deck Moderno...");

        const pitchDeckId = await ctx.db.insert("templates", {
            name: "Pitch Deck Moderno",
            description: "Plantilla profesional para presentar startups, ideas de negocio e inversiones con diseño moderno usando Fabric.js.",
        });

        // Slides del Pitch Deck (5 slides mínimo)
        const pitchDeckSlides = [
            {
                path: "/slides/slide-1.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "rect",
                            "left": 0,
                            "top": 0,
                            "width": 1920,
                            "height": 1080,
                            "fill": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            "selectable": false
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 400,
                            "fontSize": 120,
                            "text": "TU STARTUP",
                            "fill": "#ffffff",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 550,
                            "fontSize": 48,
                            "text": "Pitch Deck 2025",
                            "fill": "#e0e0e0",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "circle",
                            "left": 150,
                            "top": 150,
                            "radius": 80,
                            "fill": "rgba(255, 255, 255, 0.1)",
                            "stroke": "#ffffff",
                            "strokeWidth": 3
                        },
                        {
                            "type": "circle",
                            "left": 1650,
                            "top": 800,
                            "radius": 100,
                            "fill": "rgba(255, 255, 255, 0.1)",
                            "stroke": "#ffffff",
                            "strokeWidth": 3
                        }
                    ],
                    "background": "#1a1a2e"
                })
            },
            {
                path: "/slides/slide-2.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 960,
                            "top": 150,
                            "fontSize": 80,
                            "text": "El Problema",
                            "fill": "#ff6b6b",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 100,
                            "top": 350,
                            "width": 500,
                            "height": 200,
                            "fill": "rgba(255, 107, 107, 0.1)",
                            "rx": 20,
                            "ry": 20,
                            "stroke": "#ff6b6b",
                            "strokeWidth": 3
                        },
                        {
                            "type": "text",
                            "left": 350,
                            "top": 450,
                            "fontSize": 32,
                            "text": "Millones de usuarios\nenfrentan este problema",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "rect",
                            "left": 710,
                            "top": 350,
                            "width": 500,
                            "height": 200,
                            "fill": "rgba(255, 107, 107, 0.1)",
                            "rx": 20,
                            "ry": 20,
                            "stroke": "#ff6b6b",
                            "strokeWidth": 3
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 450,
                            "fontSize": 32,
                            "text": "Soluciones actuales\nson costosas",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "rect",
                            "left": 1320,
                            "top": 350,
                            "width": 500,
                            "height": 200,
                            "fill": "rgba(255, 107, 107, 0.1)",
                            "rx": 20,
                            "ry": 20,
                            "stroke": "#ff6b6b",
                            "strokeWidth": 3
                        },
                        {
                            "type": "text",
                            "left": 1570,
                            "top": 450,
                            "fontSize": 32,
                            "text": "El mercado necesita\nuna alternativa",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        }
                    ],
                    "background": "#1a1a2e"
                })
            },
            {
                path: "/slides/slide-3.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 960,
                            "top": 150,
                            "fontSize": 80,
                            "text": "Nuestra Solución",
                            "fill": "#51cf66",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "circle",
                            "left": 400,
                            "top": 450,
                            "radius": 120,
                            "fill": "rgba(81, 207, 102, 0.2)",
                            "stroke": "#51cf66",
                            "strokeWidth": 4
                        },
                        {
                            "type": "text",
                            "left": 400,
                            "top": 450,
                            "fontSize": 40,
                            "text": "70%",
                            "fill": "#51cf66",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "text",
                            "left": 400,
                            "top": 620,
                            "fontSize": 28,
                            "text": "Reducción de costos",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "circle",
                            "left": 960,
                            "top": 450,
                            "radius": 120,
                            "fill": "rgba(81, 207, 102, 0.2)",
                            "stroke": "#51cf66",
                            "strokeWidth": 4
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 450,
                            "fontSize": 40,
                            "text": "IA",
                            "fill": "#51cf66",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 620,
                            "fontSize": 28,
                            "text": "Tecnología avanzada",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "circle",
                            "left": 1520,
                            "top": 450,
                            "radius": 120,
                            "fill": "rgba(81, 207, 102, 0.2)",
                            "stroke": "#51cf66",
                            "strokeWidth": 4
                        },
                        {
                            "type": "text",
                            "left": 1520,
                            "top": 450,
                            "fontSize": 40,
                            "text": "∞",
                            "fill": "#51cf66",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "text",
                            "left": 1520,
                            "top": 620,
                            "fontSize": 28,
                            "text": "Escalabilidad",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        }
                    ],
                    "background": "#1a1a2e"
                })
            },
            {
                path: "/slides/slide-4.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 960,
                            "top": 150,
                            "fontSize": 80,
                            "text": "Tracción",
                            "fill": "#74c0fc",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 400,
                            "top": 400,
                            "width": 300,
                            "height": 300,
                            "fill": "rgba(116, 192, 252, 0.1)",
                            "rx": 20,
                            "ry": 20,
                            "stroke": "#74c0fc",
                            "strokeWidth": 3
                        },
                        {
                            "type": "text",
                            "left": 550,
                            "top": 500,
                            "fontSize": 72,
                            "text": "30K+",
                            "fill": "#74c0fc",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 550,
                            "top": 600,
                            "fontSize": 32,
                            "text": "Usuarios",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 810,
                            "top": 400,
                            "width": 300,
                            "height": 300,
                            "fill": "rgba(116, 192, 252, 0.1)",
                            "rx": 20,
                            "ry": 20,
                            "stroke": "#74c0fc",
                            "strokeWidth": 3
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 500,
                            "fontSize": 72,
                            "text": "$150K",
                            "fill": "#74c0fc",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 600,
                            "fontSize": 32,
                            "text": "MRR",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 1220,
                            "top": 400,
                            "width": 300,
                            "height": 300,
                            "fill": "rgba(116, 192, 252, 0.1)",
                            "rx": 20,
                            "ry": 20,
                            "stroke": "#74c0fc",
                            "strokeWidth": 3
                        },
                        {
                            "type": "text",
                            "left": 1370,
                            "top": 500,
                            "fontSize": 72,
                            "text": "45%",
                            "fill": "#74c0fc",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 1370,
                            "top": 600,
                            "fontSize": 32,
                            "text": "Crecimiento MoM",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        }
                    ],
                    "background": "#1a1a2e"
                })
            },
            {
                path: "/slides/slide-5.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 960,
                            "top": 350,
                            "fontSize": 100,
                            "text": "¡Gracias!",
                            "fill": "#ffffff",
                            "fontFamily": "Arial Black",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 500,
                            "fontSize": 48,
                            "text": "Construyamos el futuro juntos",
                            "fill": "#b8b8b8",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 650,
                            "fontSize": 36,
                            "text": "📧 contacto@tustartup.com",
                            "fill": "#74c0fc",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 720,
                            "fontSize": 36,
                            "text": "🌐 www.tustartup.com",
                            "fill": "#74c0fc",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        }
                    ],
                    "background": "#1a1a2e"
                })
            }
        ];

        for (const slide of pitchDeckSlides) {
            await ctx.db.insert("templateFiles", {
                templateId: pitchDeckId,
                path: slide.path,
                content: slide.content,
            });
        }

        console.log(`✅ Pitch Deck creado con ${pitchDeckSlides.length} slides`);

        // 3. Crear template "Presentación Minimalista"
        console.log("📦 Creando template: Presentación Minimalista...");

        const minimalistId = await ctx.db.insert("templates", {
            name: "Presentación Minimalista",
            description: "Diseño limpio y minimalista para presentaciones profesionales y corporativas con Fabric.js.",
        });

        // Slides minimalistas (5 slides mínimo)
        const minimalistSlides = [
            {
                path: "/slides/slide-1.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 960,
                            "top": 500,
                            "fontSize": 100,
                            "text": "TÍTULO DE LA PRESENTACIÓN",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "300",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        },
                        {
                            "type": "line",
                            "x1": 760,
                            "y1": 580,
                            "x2": 1160,
                            "y2": 580,
                            "stroke": "#000000",
                            "strokeWidth": 2
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 640,
                            "fontSize": 32,
                            "text": "Subtítulo o descripción",
                            "fill": "#666666",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        }
                    ],
                    "background": "#ffffff"
                })
            },
            {
                path: "/slides/slide-2.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 200,
                            "top": 150,
                            "fontSize": 64,
                            "text": "Punto Principal",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "bold"
                        },
                        {
                            "type": "text",
                            "left": 200,
                            "top": 350,
                            "fontSize": 36,
                            "text": "• Primera idea importante",
                            "fill": "#333333",
                            "fontFamily": "Arial"
                        },
                        {
                            "type": "text",
                            "left": 200,
                            "top": 450,
                            "fontSize": 36,
                            "text": "• Segunda idea importante",
                            "fill": "#333333",
                            "fontFamily": "Arial"
                        },
                        {
                            "type": "text",
                            "left": 200,
                            "top": 550,
                            "fontSize": 36,
                            "text": "• Tercera idea importante",
                            "fill": "#333333",
                            "fontFamily": "Arial"
                        }
                    ],
                    "background": "#ffffff"
                })
            },
            {
                path: "/slides/slide-3.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 200,
                            "top": 150,
                            "fontSize": 64,
                            "text": "Datos Clave",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "bold"
                        },
                        {
                            "type": "rect",
                            "left": 200,
                            "top": 300,
                            "width": 400,
                            "height": 300,
                            "fill": "#f5f5f5",
                            "stroke": "#000000",
                            "strokeWidth": 2
                        },
                        {
                            "type": "text",
                            "left": 400,
                            "top": 400,
                            "fontSize": 72,
                            "text": "85%",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 400,
                            "top": 500,
                            "fontSize": 28,
                            "text": "Métrica importante",
                            "fill": "#666666",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 700,
                            "top": 300,
                            "width": 400,
                            "height": 300,
                            "fill": "#f5f5f5",
                            "stroke": "#000000",
                            "strokeWidth": 2
                        },
                        {
                            "type": "text",
                            "left": 900,
                            "top": 400,
                            "fontSize": 72,
                            "text": "2.5x",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 900,
                            "top": 500,
                            "fontSize": 28,
                            "text": "Crecimiento",
                            "fill": "#666666",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 1200,
                            "top": 300,
                            "width": 400,
                            "height": 300,
                            "fill": "#f5f5f5",
                            "stroke": "#000000",
                            "strokeWidth": 2
                        },
                        {
                            "type": "text",
                            "left": 1400,
                            "top": 400,
                            "fontSize": 72,
                            "text": "100+",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 1400,
                            "top": 500,
                            "fontSize": 28,
                            "text": "Clientes",
                            "fill": "#666666",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        }
                    ],
                    "background": "#ffffff"
                })
            },
            {
                path: "/slides/slide-4.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 960,
                            "top": 250,
                            "fontSize": 64,
                            "text": "Visión de Futuro",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 450,
                            "fontSize": 36,
                            "text": "Nuestro objetivo es transformar la industria",
                            "fill": "#333333",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 550,
                            "fontSize": 36,
                            "text": "a través de la innovación constante",
                            "fill": "#333333",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 650,
                            "fontSize": 36,
                            "text": "y el compromiso con la excelencia",
                            "fill": "#333333",
                            "fontFamily": "Arial",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 660,
                            "top": 720,
                            "width": 600,
                            "height": 4,
                            "fill": "#000000"
                        }
                    ],
                    "background": "#ffffff"
                })
            },
            {
                path: "/slides/slide-5.json",
                content: JSON.stringify({
                    "version": "5.3.0",
                    "objects": [
                        {
                            "type": "text",
                            "left": 960,
                            "top": 500,
                            "fontSize": 80,
                            "text": "Gracias",
                            "fill": "#000000",
                            "fontFamily": "Arial",
                            "fontWeight": "300",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
                        }
                    ],
                    "background": "#ffffff"
                })
            }
        ];

        for (const slide of minimalistSlides) {
            await ctx.db.insert("templateFiles", {
                templateId: minimalistId,
                path: slide.path,
                content: slide.content,
            });
        }

        console.log(`✅ Presentación Minimalista creada con ${minimalistSlides.length} slides`);

        return {
            success: true,
            message: "✨ Templates de Fabric.js creados exitosamente",
            templates: [
                { name: "Pitch Deck Moderno", slides: pitchDeckSlides.length },
                { name: "Presentación Minimalista", slides: minimalistSlides.length }
            ]
        };
    },
});
