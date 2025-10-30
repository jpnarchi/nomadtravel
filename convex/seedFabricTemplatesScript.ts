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

        // Slides del Pitch Deck
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
                            "fill": "#667eea"
                        },
                        {
                            "type": "text",
                            "left": 960,
                            "top": 400,
                            "fontSize": 120,
                            "text": "TU STARTUP",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
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
                            "fontFamily": "Arial",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center"
                        },
                        {
                            "type": "rect",
                            "left": 350,
                            "top": 350,
                            "width": 450,
                            "height": 200,
                            "fill": "rgba(255, 107, 107, 0.2)",
                            "rx": 20,
                            "ry": 20,
                            "stroke": "#ff6b6b",
                            "strokeWidth": 3
                        },
                        {
                            "type": "text",
                            "left": 575,
                            "top": 450,
                            "fontSize": 28,
                            "text": "Millones de usuarios\nenfrentan este problema",
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
                            "fontFamily": "Arial",
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
                            "fontSize": 60,
                            "text": "70%",
                            "fill": "#51cf66",
                            "fontFamily": "Arial",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
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
                            "top": 400,
                            "fontSize": 100,
                            "text": "¡Gracias!",
                            "fill": "#ffffff",
                            "fontFamily": "Arial",
                            "fontWeight": "bold",
                            "textAlign": "center",
                            "originX": "center",
                            "originY": "center"
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
                            "text": "• Primera idea importante\n• Segunda idea importante\n• Tercera idea importante",
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
