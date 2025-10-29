// PresentAI - Slide Type Templates
// These are reference templates for the AI to use when creating slides

export const slideTemplates = {
  // 1. Slide de Título
  titleSlide: `import React from "react";

export default function TitleSlide() {
  return (
    <section className="flex flex-col items-center justify-center h-full">
      <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Título Principal
      </h1>
      <p className="text-3xl text-gray-300">
        Subtítulo descriptivo
      </p>
    </section>
  );
}`,

  // 2. Slide de Contenido
  contentSlide: `import React from "react";

export default function ContentSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-8">Título del Slide</h2>
      <div className="slide-two-columns">
        <div>
          <p className="text-2xl leading-relaxed">
            Contenido de texto aquí. Puedes incluir párrafos con información relevante.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <img
            src="https://via.placeholder.com/400"
            alt="Descripción"
            className="rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}`,

  // 3. Slide con Lista
  listSlide: `import React from "react";
import { Check } from "lucide-react";

export default function ListSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12">Puntos Clave</h2>
      <ul className="text-left text-2xl space-y-6 max-w-3xl mx-auto">
        <li className="flex items-start gap-4">
          <Check className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
          <span>Primer punto importante</span>
        </li>
        <li className="flex items-start gap-4">
          <Check className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
          <span>Segundo punto importante</span>
        </li>
        <li className="flex items-start gap-4">
          <Check className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
          <span>Tercer punto importante</span>
        </li>
      </ul>
    </section>
  );
}`,

  // 4. Slide con Código
  codeSlide: `import React from "react";

export default function CodeSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-8">Ejemplo de Código</h2>
      <pre className="text-left"><code className="language-javascript">
{/\`function hello(name) {
  return \\\`Hello, \\\${name}!\\\`;
}

const greeting = hello('World');
console.log(greeting); // Hello, World!\`/}
      </code></pre>
    </section>
  );
}`,

  // 5. Slide con Gráfico
  chartSlide: `import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { name: 'Ene', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Abr', value: 4500 },
  { name: 'May', value: 6000 },
];

export default function ChartSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-8">Estadísticas</h2>
      <ResponsiveContainer width="90%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}`,

  // 6. Slide con Imagen Full
  imageFullSlide: `import React from "react";

export default function ImageFullSlide() {
  return (
    <section className="relative p-0" data-background-image="https://via.placeholder.com/1920x1080">
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-12">
        <h2 className="text-6xl font-bold text-white mb-4">
          Título sobre Imagen
        </h2>
        <p className="text-3xl text-gray-200">
          Descripción o mensaje clave
        </p>
      </div>
    </section>
  );
}`,

  // 7. Slide de Video
  videoSlide: `import React from "react";

export default function VideoSlide() {
  return (
    <section>
      <h2 className="text-4xl font-bold mb-8">Video</h2>
      <div className="aspect-video max-w-4xl mx-auto">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg shadow-2xl"
        />
      </div>
    </section>
  );
}`,

  // 8. Slide Interactivo
  interactiveSlide: `import React from "react";
import { motion } from "framer-motion";
import { Zap, Rocket, Target } from "lucide-react";

export default function InteractiveSlide() {
  return (
    <section>
      <h2 className="text-5xl font-bold mb-12">Características</h2>
      <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
        <motion.div
          className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Zap className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-2xl font-bold mb-2">Rápido</h3>
          <p className="text-lg text-gray-300">Descripción aquí</p>
        </motion.div>

        <motion.div
          className="p-6 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Rocket className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h3 className="text-2xl font-bold mb-2">Potente</h3>
          <p className="text-lg text-gray-300">Descripción aquí</p>
        </motion.div>

        <motion.div
          className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Target className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-2xl font-bold mb-2">Preciso</h3>
          <p className="text-lg text-gray-300">Descripción aquí</p>
        </motion.div>
      </div>
    </section>
  );
}`,
};

export const slideTypeDescriptions = {
  title: "Slide de Título - Título principal + subtítulo",
  content: "Slide de Contenido - Texto + imágenes en layout flexible",
  list: "Slide con Lista - Puntos clave (sin animaciones, todos visibles)",
  code: "Slide con Código - Bloques de código con syntax highlighting",
  chart: "Slide con Gráfico - Gráficos con recharts (bar, line, pie, area)",
  imageFull: "Slide con Imagen Full - Imagen de fondo a pantalla completa",
  video: "Slide de Video - Video embebido (YouTube, Vimeo, o local)",
  interactive: "Slide Interactivo - Cards interactivos con hover effects",
};
