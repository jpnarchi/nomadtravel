/**
 * Script para subir templates de Fabric.js a Convex
 *
 * Ejecutar: npx tsx scripts/upload-fabric-templates.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.local first, then .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
    console.error("❌ Error: CONVEX_URL no está definida");
    console.error("Por favor, asegúrate de tener NEXT_PUBLIC_CONVEX_URL en tu archivo .env.local o .env");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Template 1: Pitch Deck Profesional
const pitchDeckTemplate = {
    name: "Pitch Deck Profesional",
    description: "Template moderno para presentaciones de startups con diseño profesional",
    files: [
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
                    },
                    {
                        "type": "circle",
                        "left": 150,
                        "top": 150,
                        "radius": 60,
                        "fill": "rgba(255, 255, 255, 0.1)",
                        "stroke": "#ffffff",
                        "strokeWidth": 2
                    },
                    {
                        "type": "circle",
                        "left": 1700,
                        "top": 850,
                        "radius": 80,
                        "fill": "rgba(255, 255, 255, 0.1)",
                        "stroke": "#ffffff",
                        "strokeWidth": 2
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
                        "left": 300,
                        "top": 350,
                        "width": 450,
                        "height": 180,
                        "fill": "rgba(255, 107, 107, 0.2)",
                        "rx": 20,
                        "ry": 20,
                        "stroke": "#ff6b6b",
                        "strokeWidth": 3
                    },
                    {
                        "type": "text",
                        "left": 525,
                        "top": 440,
                        "fontSize": 32,
                        "text": "Problema 1:\nMercado desatendido",
                        "fill": "#ffffff",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center"
                    },
                    {
                        "type": "rect",
                        "left": 835,
                        "top": 350,
                        "width": 450,
                        "height": 180,
                        "fill": "rgba(255, 107, 107, 0.2)",
                        "rx": 20,
                        "ry": 20,
                        "stroke": "#ff6b6b",
                        "strokeWidth": 3
                    },
                    {
                        "type": "text",
                        "left": 1060,
                        "top": 440,
                        "fontSize": 32,
                        "text": "Problema 2:\nCostos elevados",
                        "fill": "#ffffff",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center"
                    },
                    {
                        "type": "rect",
                        "left": 1370,
                        "top": 350,
                        "width": 450,
                        "height": 180,
                        "fill": "rgba(255, 107, 107, 0.2)",
                        "rx": 20,
                        "ry": 20,
                        "stroke": "#ff6b6b",
                        "strokeWidth": 3
                    },
                    {
                        "type": "text",
                        "left": 1595,
                        "top": 440,
                        "fontSize": 32,
                        "text": "Problema 3:\nFalta de innovación",
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
                        "top": 420,
                        "fontSize": 60,
                        "text": "70%",
                        "fill": "#51cf66",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center"
                    },
                    {
                        "type": "text",
                        "left": 400,
                        "top": 620,
                        "fontSize": 24,
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
                        "top": 420,
                        "fontSize": 60,
                        "text": "3x",
                        "fill": "#51cf66",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center"
                    },
                    {
                        "type": "text",
                        "left": 960,
                        "top": 620,
                        "fontSize": 24,
                        "text": "Más rápido",
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
                        "top": 420,
                        "fontSize": 60,
                        "text": "100%",
                        "fill": "#51cf66",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center"
                    },
                    {
                        "type": "text",
                        "left": 1520,
                        "top": 620,
                        "fontSize": 24,
                        "text": "Escalable",
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
                        "top": 200,
                        "fontSize": 70,
                        "text": "Tracción",
                        "fill": "#74c0fc",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "rect",
                        "left": 300,
                        "top": 400,
                        "width": 350,
                        "height": 250,
                        "fill": "rgba(116, 192, 252, 0.15)",
                        "rx": 20,
                        "ry": 20,
                        "stroke": "#74c0fc",
                        "strokeWidth": 3
                    },
                    {
                        "type": "text",
                        "left": 475,
                        "top": 480,
                        "fontSize": 70,
                        "text": "30K+",
                        "fill": "#74c0fc",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "text",
                        "left": 475,
                        "top": 580,
                        "fontSize": 28,
                        "text": "Usuarios Activos",
                        "fill": "#ffffff",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "rect",
                        "left": 785,
                        "top": 400,
                        "width": 350,
                        "height": 250,
                        "fill": "rgba(116, 192, 252, 0.15)",
                        "rx": 20,
                        "ry": 20,
                        "stroke": "#74c0fc",
                        "strokeWidth": 3
                    },
                    {
                        "type": "text",
                        "left": 960,
                        "top": 480,
                        "fontSize": 70,
                        "text": "$150K",
                        "fill": "#74c0fc",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "text",
                        "left": 960,
                        "top": 580,
                        "fontSize": 28,
                        "text": "MRR",
                        "fill": "#ffffff",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "rect",
                        "left": 1270,
                        "top": 400,
                        "width": 350,
                        "height": 250,
                        "fill": "rgba(116, 192, 252, 0.15)",
                        "rx": 20,
                        "ry": 20,
                        "stroke": "#74c0fc",
                        "strokeWidth": 3
                    },
                    {
                        "type": "text",
                        "left": 1445,
                        "top": 480,
                        "fontSize": 70,
                        "text": "45%",
                        "fill": "#74c0fc",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "text",
                        "left": 1445,
                        "top": 580,
                        "fontSize": 28,
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
                        "top": 400,
                        "fontSize": 110,
                        "text": "¡Gracias!",
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
                        "fontSize": 40,
                        "text": "Construyamos el futuro juntos",
                        "fill": "#b8b8b8",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "text",
                        "left": 960,
                        "top": 700,
                        "fontSize": 32,
                        "text": "contacto@tustartup.com",
                        "fill": "#74c0fc",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    }
                ],
                "background": "#1a1a2e"
            })
        }
    ]
};

// Template 2: Presentación Corporativa
const corporateTemplate = {
    name: "Presentación Corporativa",
    description: "Template minimalista y profesional para presentaciones de negocios",
    files: [
        {
            path: "/slides/slide-1.json",
            content: JSON.stringify({
                "version": "5.3.0",
                "objects": [
                    {
                        "type": "rect",
                        "left": 0,
                        "top": 0,
                        "width": 200,
                        "height": 1080,
                        "fill": "#2563eb"
                    },
                    {
                        "type": "text",
                        "left": 1060,
                        "top": 450,
                        "fontSize": 90,
                        "text": "PRESENTACIÓN\nCORPORATIVA",
                        "fill": "#1e293b",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center"
                    },
                    {
                        "type": "line",
                        "x1": 500,
                        "y1": 570,
                        "x2": 1620,
                        "y2": 570,
                        "stroke": "#2563eb",
                        "strokeWidth": 4
                    },
                    {
                        "type": "text",
                        "left": 1060,
                        "top": 650,
                        "fontSize": 36,
                        "text": "2025",
                        "fill": "#64748b",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    }
                ],
                "background": "#f8fafc"
            })
        },
        {
            path: "/slides/slide-2.json",
            content: JSON.stringify({
                "version": "5.3.0",
                "objects": [
                    {
                        "type": "rect",
                        "left": 0,
                        "top": 0,
                        "width": 200,
                        "height": 1080,
                        "fill": "#2563eb"
                    },
                    {
                        "type": "text",
                        "left": 600,
                        "top": 150,
                        "fontSize": 70,
                        "text": "Agenda",
                        "fill": "#1e293b",
                        "fontFamily": "Arial",
                        "fontWeight": "bold"
                    },
                    {
                        "type": "text",
                        "left": 600,
                        "top": 320,
                        "fontSize": 40,
                        "text": "01  Introducción",
                        "fill": "#475569",
                        "fontFamily": "Arial"
                    },
                    {
                        "type": "text",
                        "left": 600,
                        "top": 420,
                        "fontSize": 40,
                        "text": "02  Objetivos",
                        "fill": "#475569",
                        "fontFamily": "Arial"
                    },
                    {
                        "type": "text",
                        "left": 600,
                        "top": 520,
                        "fontSize": 40,
                        "text": "03  Estrategia",
                        "fill": "#475569",
                        "fontFamily": "Arial"
                    },
                    {
                        "type": "text",
                        "left": 600,
                        "top": 620,
                        "fontSize": 40,
                        "text": "04  Resultados",
                        "fill": "#475569",
                        "fontFamily": "Arial"
                    },
                    {
                        "type": "text",
                        "left": 600,
                        "top": 720,
                        "fontSize": 40,
                        "text": "05  Conclusiones",
                        "fill": "#475569",
                        "fontFamily": "Arial"
                    }
                ],
                "background": "#f8fafc"
            })
        },
        {
            path: "/slides/slide-3.json",
            content: JSON.stringify({
                "version": "5.3.0",
                "objects": [
                    {
                        "type": "rect",
                        "left": 0,
                        "top": 0,
                        "width": 200,
                        "height": 1080,
                        "fill": "#2563eb"
                    },
                    {
                        "type": "text",
                        "left": 600,
                        "top": 150,
                        "fontSize": 70,
                        "text": "Puntos Clave",
                        "fill": "#1e293b",
                        "fontFamily": "Arial",
                        "fontWeight": "bold"
                    },
                    {
                        "type": "rect",
                        "left": 600,
                        "top": 350,
                        "width": 500,
                        "height": 200,
                        "fill": "#eff6ff",
                        "rx": 15,
                        "ry": 15,
                        "stroke": "#2563eb",
                        "strokeWidth": 2
                    },
                    {
                        "type": "text",
                        "left": 850,
                        "top": 380,
                        "fontSize": 36,
                        "text": "Innovación",
                        "fill": "#2563eb",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "text",
                        "left": 850,
                        "top": 450,
                        "fontSize": 24,
                        "text": "Soluciones tecnológicas\nde vanguardia",
                        "fill": "#475569",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "rect",
                        "left": 1220,
                        "top": 350,
                        "width": 500,
                        "height": 200,
                        "fill": "#eff6ff",
                        "rx": 15,
                        "ry": 15,
                        "stroke": "#2563eb",
                        "strokeWidth": 2
                    },
                    {
                        "type": "text",
                        "left": 1470,
                        "top": 380,
                        "fontSize": 36,
                        "text": "Excelencia",
                        "fill": "#2563eb",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center"
                    },
                    {
                        "type": "text",
                        "left": 1470,
                        "top": 450,
                        "fontSize": 24,
                        "text": "Compromiso con\nla calidad",
                        "fill": "#475569",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    }
                ],
                "background": "#f8fafc"
            })
        },
        {
            path: "/slides/slide-4.json",
            content: JSON.stringify({
                "version": "5.3.0",
                "objects": [
                    {
                        "type": "rect",
                        "left": 0,
                        "top": 0,
                        "width": 200,
                        "height": 1080,
                        "fill": "#2563eb"
                    },
                    {
                        "type": "text",
                        "left": 1060,
                        "top": 450,
                        "fontSize": 80,
                        "text": "Gracias",
                        "fill": "#1e293b",
                        "fontFamily": "Arial",
                        "fontWeight": "bold",
                        "textAlign": "center",
                        "originX": "center",
                        "originY": "center"
                    },
                    {
                        "type": "text",
                        "left": 1060,
                        "top": 600,
                        "fontSize": 32,
                        "text": "info@empresa.com",
                        "fill": "#2563eb",
                        "fontFamily": "Arial",
                        "textAlign": "center",
                        "originX": "center"
                    }
                ],
                "background": "#f8fafc"
            })
        }
    ]
};

async function uploadTemplates() {
    console.log("🚀 Iniciando carga de templates...\n");

    try {
        // Subir Template 1
        console.log("📦 Subiendo: Pitch Deck Profesional...");
        const template1 = await client.mutation(api.templates.createTemplateWithFiles, {
            name: pitchDeckTemplate.name,
            description: pitchDeckTemplate.description,
            files: pitchDeckTemplate.files
        });
        console.log(`✅ ${pitchDeckTemplate.name} - ${pitchDeckTemplate.files.length} slides creados\n`);

        // Subir Template 2
        console.log("📦 Subiendo: Presentación Corporativa...");
        const template2 = await client.mutation(api.templates.createTemplateWithFiles, {
            name: corporateTemplate.name,
            description: corporateTemplate.description,
            files: corporateTemplate.files
        });
        console.log(`✅ ${corporateTemplate.name} - ${corporateTemplate.files.length} slides creados\n`);

        console.log("🎉 ¡Templates subidos exitosamente!");
        console.log("\nTemplates disponibles:");
        console.log(`  1. ${pitchDeckTemplate.name} (${pitchDeckTemplate.files.length} slides)`);
        console.log(`  2. ${corporateTemplate.name} (${corporateTemplate.files.length} slides)`);

    } catch (error) {
        console.error("❌ Error al subir templates:", error);
        process.exit(1);
    }
}

uploadTemplates();
