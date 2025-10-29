/**
 * Script para crear 2 plantillas de presentación en Convex
 * Ejecutar con: npx convex run scripts/seed-presentation-templates
 */

import { mutation } from "../convex/_generated/server";
import { v } from "convex/values";

// Plantilla 1: Pitch Deck Startup
const pitchDeckTemplate = {
    name: "Pitch Deck Startup",
    description: "Plantilla profesional para presentar startups, ideas de negocio e inversiones. Incluye slides de problema, solución, mercado, tracción y más.",
    files: {
        "/index.html": `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pitch Deck - Startup</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/black.css" id="theme">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/highlight/monokai.css">
  </head>
  <body>
    <div class="reveal">
      <div class="slides" id="root"></div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/highlight/highlight.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/notes/notes.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/zoom/zoom.js"></script>
  </body>
</html>`,

        "/index.js": `import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import Presentation from "./Presentation";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <Presentation />
  </StrictMode>
);

setTimeout(() => {
  if (window.Reveal) {
    window.Reveal.initialize({
      controls: true,
      progress: true,
      center: true,
      hash: true,
      transition: 'slide',
      transitionSpeed: 'default',
      slideNumber: 'c/t',
      keyboard: true,
      overview: true,
      touch: true,
      loop: false,
      fragments: true,
      autoAnimate: true,
      autoAnimateEasing: 'ease',
      autoAnimateDuration: 1.0,
      width: 960,
      height: 700,
      margin: 0.04,
      minScale: 0.2,
      maxScale: 2.0,
      plugins: window.RevealHighlight ? [window.RevealHighlight, window.RevealNotes, window.RevealZoom] : []
    });
  }
}, 100);`,

        "/Presentation.js": `import React from "react";
import TitleSlide from "./slides/TitleSlide";
import ProblemSlide from "./slides/ProblemSlide";
import SolutionSlide from "./slides/SolutionSlide";
import MarketSlide from "./slides/MarketSlide";
import ProductSlide from "./slides/ProductSlide";
import TractionSlide from "./slides/TractionSlide";
import TeamSlide from "./slides/TeamSlide";
import FinancesSlide from "./slides/FinancesSlide";
import ClosingSlide from "./slides/ClosingSlide";

export default function Presentation() {
  return (
    <>
      <TitleSlide />
      <ProblemSlide />
      <SolutionSlide />
      <MarketSlide />
      <ProductSlide />
      <TractionSlide />
      <TeamSlide />
      <FinancesSlide />
      <ClosingSlide />
    </>
  );
}`,

        "/slides/TitleSlide.js": `import React from "react";
import { Rocket } from "lucide-react";

export default function TitleSlide() {
  return (
    <section className="flex flex-col items-center justify-center h-full">
      <Rocket className="w-24 h-24 mb-8 text-blue-400 animate-pulse" />
      <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        Tu Startup
      </h1>
      <p className="text-3xl text-gray-300 mb-4">
        Revolucionando la industria
      </p>
      <p className="text-xl text-gray-500">
        Pitch Deck 2025
      </p>
    </section>
  );
}`,

        "/slides/ProblemSlide.js": `import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ProblemSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12 text-center">El Problema</h2>
      <div className="max-w-4xl mx-auto">
        <ul className="text-2xl space-y-6">
          <li className="fragment flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <span>Millones de usuarios enfrentan [problema específico]</span>
          </li>
          <li className="fragment flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <span>Las soluciones actuales son costosas e ineficientes</span>
          </li>
          <li className="fragment flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <span>El mercado necesita una alternativa innovadora</span>
          </li>
        </ul>
      </div>
    </section>
  );
}`,

        "/slides/SolutionSlide.js": `import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function SolutionSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12 text-center">Nuestra Solución</h2>
      <div className="max-w-4xl mx-auto">
        <ul className="text-2xl space-y-6">
          <li className="fragment flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
            <span>Plataforma intuitiva que [soluciona el problema]</span>
          </li>
          <li className="fragment flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
            <span>Reduce costos en un 70% comparado con competidores</span>
          </li>
          <li className="fragment flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
            <span>Tecnología de última generación con IA integrada</span>
          </li>
        </ul>
      </div>
    </section>
  );
}`,

        "/slides/MarketSlide.js": `import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { year: '2023', tam: 50, sam: 20, som: 5 },
  { year: '2024', tam: 65, sam: 28, som: 8 },
  { year: '2025', tam: 85, sam: 38, som: 12 },
  { year: '2026', tam: 110, sam: 50, som: 18 },
];

export default function MarketSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-8 text-center">Tamaño del Mercado</h2>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="90%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" label={{ value: 'Billones USD', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="tam" fill="#3B82F6" name="TAM" />
            <Bar dataKey="sam" fill="#8B5CF6" name="SAM" />
            <Bar dataKey="som" fill="#EC4899" name="SOM" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-lg mt-6">
          Mercado proyectado de $110B para 2026
        </p>
      </div>
    </section>
  );
}`,

        "/slides/ProductSlide.js": `import React from "react";
import { Zap, Shield, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12 text-center">Producto</h2>
      <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
        <motion.div
          className="fragment p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Zap className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-2xl font-bold mb-2 text-center">Rápido</h3>
          <p className="text-lg text-gray-300 text-center">Resultados en menos de 2 segundos</p>
        </motion.div>

        <motion.div
          className="fragment p-6 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Shield className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h3 className="text-2xl font-bold mb-2 text-center">Seguro</h3>
          <p className="text-lg text-gray-300 text-center">Encriptación de grado militar</p>
        </motion.div>

        <motion.div
          className="fragment p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-pink-400" />
          <h3 className="text-2xl font-bold mb-2 text-center">Móvil</h3>
          <p className="text-lg text-gray-300 text-center">Disponible en iOS y Android</p>
        </motion.div>
      </div>
    </section>
  );
}`,

        "/slides/TractionSlide.js": `import React from "react";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { mes: 'Ene', usuarios: 1000, ingresos: 5000 },
  { mes: 'Feb', usuarios: 2500, ingresos: 12500 },
  { mes: 'Mar', usuarios: 5000, ingresos: 25000 },
  { mes: 'Abr', usuarios: 10000, ingresos: 50000 },
  { mes: 'May', usuarios: 18000, ingresos: 90000 },
  { mes: 'Jun', usuarios: 30000, ingresos: 150000 },
];

export default function TractionSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-8 text-center flex items-center justify-center gap-3">
        <TrendingUp className="w-10 h-10 text-green-400" />
        Tracción
      </h2>
      <ResponsiveContainer width="90%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="mes" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
          <Legend />
          <Line type="monotone" dataKey="usuarios" stroke="#3B82F6" strokeWidth={3} name="Usuarios" />
          <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={3} name="Ingresos (USD)" />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
        <div className="text-center fragment">
          <p className="text-4xl font-bold text-blue-400">30K+</p>
          <p className="text-gray-400">Usuarios</p>
        </div>
        <div className="text-center fragment">
          <p className="text-4xl font-bold text-green-400">$150K</p>
          <p className="text-gray-400">MRR</p>
        </div>
        <div className="text-center fragment">
          <p className="text-4xl font-bold text-purple-400">45%</p>
          <p className="text-gray-400">Crecimiento MoM</p>
        </div>
      </div>
    </section>
  );
}`,

        "/slides/TeamSlide.js": `import React from "react";
import { Users } from "lucide-react";

export default function TeamSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12 text-center flex items-center justify-center gap-3">
        <Users className="w-12 h-12" />
        Equipo
      </h2>
      <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="fragment text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-4xl font-bold">
            JD
          </div>
          <h3 className="text-2xl font-bold mb-2">John Doe</h3>
          <p className="text-xl text-blue-400 mb-2">CEO & Co-founder</p>
          <p className="text-gray-400">Ex-Google, Stanford MBA</p>
        </div>

        <div className="fragment text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-4xl font-bold">
            JS
          </div>
          <h3 className="text-2xl font-bold mb-2">Jane Smith</h3>
          <p className="text-xl text-green-400 mb-2">CTO & Co-founder</p>
          <p className="text-gray-400">Ex-Meta, MIT Computer Science</p>
        </div>

        <div className="fragment text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold">
            MJ
          </div>
          <h3 className="text-2xl font-bold mb-2">Mike Johnson</h3>
          <p className="text-xl text-purple-400 mb-2">CPO & Co-founder</p>
          <p className="text-gray-400">Ex-Apple, Design Lead</p>
        </div>
      </div>
    </section>
  );
}`,

        "/slides/FinancesSlide.js": `import React from "react";
import { DollarSign } from "lucide-react";

export default function FinancesSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12 text-center flex items-center justify-center gap-3">
        <DollarSign className="w-12 h-12 text-green-400" />
        Ronda de Financiamiento
      </h2>
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-8 mb-8 fragment">
          <p className="text-3xl font-bold text-center mb-2">Buscando levantar</p>
          <p className="text-6xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            $2M USD
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-xl">
          <div className="fragment">
            <p className="text-gray-400 mb-2">Uso de fondos:</p>
            <ul className="space-y-2">
              <li>• 40% Desarrollo de producto</li>
              <li>• 30% Marketing y ventas</li>
              <li>• 20% Contratación de talento</li>
              <li>• 10% Operaciones</li>
            </ul>
          </div>
          <div className="fragment">
            <p className="text-gray-400 mb-2">Proyecciones 18 meses:</p>
            <ul className="space-y-2">
              <li>• 200K+ usuarios activos</li>
              <li>• $1M+ MRR</li>
              <li>• Rentabilidad positiva</li>
              <li>• Expansión internacional</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}`,

        "/slides/ClosingSlide.js": `import React from "react";
import { Mail, Globe } from "lucide-react";

export default function ClosingSlide() {
  return (
    <section className="flex flex-col items-center justify-center h-full">
      <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
        ¡Gracias!
      </h1>
      <p className="text-3xl text-gray-300 mb-12">
        Construyamos el futuro juntos
      </p>

      <div className="space-y-4 text-xl">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-blue-400" />
          <span>contacto@tustartup.com</span>
        </div>
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-purple-400" />
          <span>www.tustartup.com</span>
        </div>
      </div>

      <p className="text-gray-500 mt-12">
        Presentación confidencial - 2025
      </p>
    </section>
  );
}`,

        "/styles.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.reveal {
  font-family: 'Inter', sans-serif;
}

.reveal h1,
.reveal h2,
.reveal h3 {
  font-family: 'Inter', sans-serif;
  text-transform: none;
  font-weight: 700;
}

.reveal section {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}`,

        "/package.json": `{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-scripts": "^5.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "recharts": "^2.12.0"
  },
  "main": "/index.js",
  "devDependencies": {}
}`
    }
};

// Plantilla 2: Presentación Técnica
const technicalPresentationTemplate = {
    name: "Presentación Técnica",
    description: "Plantilla para presentaciones técnicas de desarrollo, arquitectura de software, APIs y demos de tecnología.",
    files: {
        "/index.html": `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentación Técnica</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/moon.css" id="theme">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/highlight/monokai.css">
  </head>
  <body>
    <div class="reveal">
      <div class="slides" id="root"></div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/highlight/highlight.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/notes/notes.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/plugin/zoom/zoom.js"></script>
  </body>
</html>`,

        "/index.js": `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import Presentation from "./Presentation";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <Presentation />
  </StrictMode>
);

setTimeout(() => {
  if (window.Reveal) {
    window.Reveal.initialize({
      controls: true,
      progress: true,
      center: true,
      hash: true,
      transition: 'convex',
      transitionSpeed: 'default',
      slideNumber: 'c/t',
      keyboard: true,
      overview: true,
      touch: true,
      loop: false,
      fragments: true,
      autoAnimate: true,
      width: 960,
      height: 700,
      margin: 0.04,
      plugins: window.RevealHighlight ? [window.RevealHighlight, window.RevealNotes, window.RevealZoom] : []
    });
  }
}, 100);`,

        "/Presentation.js": `import React from "react";
import TitleSlide from "./slides/TitleSlide";
import AgendaSlide from "./slides/AgendaSlide";
import ArchitectureSlide from "./slides/ArchitectureSlide";
import CodeExampleSlide from "./slides/CodeExampleSlide";
import APISlide from "./slides/APISlide";
import PerformanceSlide from "./slides/PerformanceSlide";
import SecuritySlide from "./slides/SecuritySlide";
import DemoSlide from "./slides/DemoSlide";
import QASlide from "./slides/QASlide";

export default function Presentation() {
  return (
    <>
      <TitleSlide />
      <AgendaSlide />
      <ArchitectureSlide />
      <CodeExampleSlide />
      <APISlide />
      <PerformanceSlide />
      <SecuritySlide />
      <DemoSlide />
      <QASlide />
    </>
  );
}`,

        "/slides/TitleSlide.js": `import React from "react";
import { Code } from "lucide-react";

export default function TitleSlide() {
  return (
    <section className="flex flex-col items-center justify-center h-full">
      <Code className="w-20 h-20 mb-6 text-cyan-400" />
      <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
        Arquitectura del Sistema
      </h1>
      <p className="text-2xl text-gray-400 mb-8">
        Microservicios escalables con Node.js & React
      </p>
      <div className="text-lg text-gray-500">
        <p>Por: Equipo de Desarrollo</p>
        <p>Fecha: Enero 2025</p>
      </div>
    </section>
  );
}`,

        "/slides/AgendaSlide.js": `import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function AgendaSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12">Agenda</h2>
      <ul className="text-2xl space-y-6 max-w-3xl">
        <li className="fragment flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
          <span>Arquitectura general del sistema</span>
        </li>
        <li className="fragment flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
          <span>Ejemplos de código y mejores prácticas</span>
        </li>
        <li className="fragment flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
          <span>API REST y documentación</span>
        </li>
        <li className="fragment flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
          <span>Métricas de rendimiento</span>
        </li>
        <li className="fragment flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
          <span>Seguridad y autenticación</span>
        </li>
        <li className="fragment flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
          <span>Demo en vivo</span>
        </li>
      </ul>
    </section>
  );
}`,

        "/slides/ArchitectureSlide.js": `import React from "react";
import { Layers } from "lucide-react";

export default function ArchitectureSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <Layers className="w-10 h-10 text-cyan-400" />
        Arquitectura del Sistema
      </h2>
      <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="fragment bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-6 rounded-xl">
          <h3 className="text-2xl font-bold mb-4 text-cyan-400">Frontend</h3>
          <ul className="text-lg space-y-2">
            <li>• React 19</li>
            <li>• TypeScript</li>
            <li>• TailwindCSS</li>
            <li>• Vite</li>
          </ul>
        </div>

        <div className="fragment bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 rounded-xl">
          <h3 className="text-2xl font-bold mb-4 text-blue-400">Backend</h3>
          <ul className="text-lg space-y-2">
            <li>• Node.js 20</li>
            <li>• Express.js</li>
            <li>• PostgreSQL</li>
            <li>• Redis Cache</li>
          </ul>
        </div>

        <div className="fragment bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 rounded-xl">
          <h3 className="text-2xl font-bold mb-4 text-purple-400">DevOps</h3>
          <ul className="text-lg space-y-2">
            <li>• Docker</li>
            <li>• Kubernetes</li>
            <li>• GitHub Actions</li>
            <li>• AWS</li>
          </ul>
        </div>
      </div>
    </section>
  );
}`,

        "/slides/CodeExampleSlide.js": `import React from "react";

export default function CodeExampleSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-6">Ejemplo de Código</h2>
      <pre className="text-left"><code className="language-javascript">{
\`// Controlador de usuario con async/await
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cached = await redis.get(\\\`user:\\\${id}\\\`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Query database
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Cache result
    await redis.set(\\\`user:\\\${id}\\\`, JSON.stringify(user), 'EX', 3600);

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};\`
      }</code></pre>
    </section>
  );
}`,

        "/slides/APISlide.js": `import React from "react";

export default function APISlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-8">API REST Endpoints</h2>
      <div className="text-left max-w-4xl mx-auto space-y-4 text-lg font-mono">
        <div className="fragment bg-green-500/20 p-4 rounded-lg">
          <span className="text-green-400 font-bold">GET</span> /api/users
          <p className="text-gray-400 text-sm mt-1">Obtener lista de usuarios</p>
        </div>

        <div className="fragment bg-blue-500/20 p-4 rounded-lg">
          <span className="text-blue-400 font-bold">POST</span> /api/users
          <p className="text-gray-400 text-sm mt-1">Crear nuevo usuario</p>
        </div>

        <div className="fragment bg-yellow-500/20 p-4 rounded-lg">
          <span className="text-yellow-400 font-bold">PUT</span> /api/users/:id
          <p className="text-gray-400 text-sm mt-1">Actualizar usuario existente</p>
        </div>

        <div className="fragment bg-red-500/20 p-4 rounded-lg">
          <span className="text-red-400 font-bold">DELETE</span> /api/users/:id
          <p className="text-gray-400 text-sm mt-1">Eliminar usuario</p>
        </div>
      </div>
    </section>
  );
}`,

        "/slides/PerformanceSlide.js": `import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Zap } from "lucide-react";

const data = [
  { tiempo: '0s', latencia: 45 },
  { tiempo: '30s', latencia: 48 },
  { tiempo: '1m', latencia: 52 },
  { tiempo: '2m', latencia: 49 },
  { tiempo: '3m', latencia: 46 },
  { tiempo: '4m', latencia: 51 },
  { tiempo: '5m', latencia: 47 },
];

export default function PerformanceSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-6 flex items-center gap-3">
        <Zap className="w-10 h-10 text-yellow-400" />
        Métricas de Rendimiento
      </h2>
      <ResponsiveContainer width="90%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="tiempo" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" label={{ value: 'Latencia (ms)', angle: -90, position: 'insideLeft' }} />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
          <Line type="monotone" dataKey="latencia" stroke="#FBBF24" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-6 mt-6 max-w-3xl mx-auto">
        <div className="text-center fragment">
          <p className="text-4xl font-bold text-green-400">99.9%</p>
          <p className="text-gray-400">Uptime</p>
        </div>
        <div className="text-center fragment">
          <p className="text-4xl font-bold text-blue-400">47ms</p>
          <p className="text-gray-400">Avg Latency</p>
        </div>
        <div className="text-center fragment">
          <p className="text-4xl font-bold text-purple-400">10K</p>
          <p className="text-gray-400">Req/s</p>
        </div>
      </div>
    </section>
  );
}`,

        "/slides/SecuritySlide.js": `import React from "react";
import { Shield, Lock, Key } from "lucide-react";

export default function SecuritySlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-12 flex items-center gap-3">
        <Shield className="w-10 h-10 text-green-400" />
        Seguridad
      </h2>
      <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="fragment text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h3 className="text-2xl font-bold mb-3">Encriptación</h3>
          <p className="text-gray-400">TLS 1.3 para todas las conexiones</p>
        </div>

        <div className="fragment text-center">
          <Key className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h3 className="text-2xl font-bold mb-3">Autenticación</h3>
          <p className="text-gray-400">JWT + OAuth 2.0 + 2FA</p>
        </div>

        <div className="fragment text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h3 className="text-2xl font-bold mb-3">Protección</h3>
          <p className="text-gray-400">Rate limiting y WAF activado</p>
        </div>
      </div>
    </section>
  );
}`,

        "/slides/DemoSlide.js": `import React from "react";
import { Play } from "lucide-react";

export default function DemoSlide() {
  return (
    <section className="flex flex-col items-center justify-center h-full">
      <Play className="w-32 h-32 mb-8 text-cyan-400 animate-pulse" />
      <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
        Demo en Vivo
      </h2>
      <p className="text-2xl text-gray-400">
        Veamos el sistema en acción
      </p>
    </section>
  );
}`,

        "/slides/QASlide.js": `import React from "react";
import { HelpCircle } from "lucide-react";

export default function QASlide() {
  return (
    <section className="flex flex-col items-center justify-center h-full">
      <HelpCircle className="w-24 h-24 mb-8 text-cyan-400" />
      <h2 className="text-6xl font-bold mb-6">
        ¿Preguntas?
      </h2>
      <p className="text-2xl text-gray-400 mb-12">
        Estamos aquí para ayudarte
      </p>

      <div className="text-xl text-gray-500">
        <p>📧 dev-team@empresa.com</p>
        <p>📚 docs.empresa.com</p>
      </div>
    </section>
  );
}`,

        "/styles.css": `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;600;700;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
}

.reveal {
  font-family: 'Inter', sans-serif;
}

.reveal h1,
.reveal h2,
.reveal h3 {
  font-family: 'Inter', sans-serif;
  text-transform: none;
  font-weight: 700;
}

.reveal code,
.reveal pre {
  font-family: 'JetBrains Mono', monospace;
}

.reveal section {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
}`,

        "/package.json": `{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-scripts": "^5.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "recharts": "^2.12.0"
  },
  "main": "/index.js",
  "devDependencies": {}
}`
    }
};

export default async function seedTemplates() {
    // This would be called manually by an admin
    return {
        pitchDeck: pitchDeckTemplate,
        technical: technicalPresentationTemplate
    };
}
