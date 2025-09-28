// export const appJsTemplate = `
// import { Heart } from "lucide-react";

// export default function App() {
//   return (
//     <div className="flex flex-col items-center justify-center mt-12">
//       <h1 className="text-3xl font-bold underline">Hello Sandpack leon</h1>
//       <Heart className="size-16 text-red-500" />
//     </div>
//   );
// }
// `.trim();

// export const appJsTemplate = `
// import { ArrowRight, Github, Twitter, Globe, Zap, Shield, Layers, ChevronDown } from "lucide-react";

// export default function App() {

//   const features = [
//     {
//       icon: Zap,
//       title: "Lightning Fast",
//       description: "Optimized for speed with global edge network distribution"
//     },
//     {
//       icon: Shield,
//       title: "Secure by Default",
//       description: "Enterprise-grade security with automatic SSL certificates"
//     },
//     {
//       icon: Layers,
//       title: "Scalable Infrastructure",
//       description: "Auto-scaling that grows with your application needs"
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-black text-white overflow-x-hidden">
//       {/* Navigation */}
//       <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
//         <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
//               <Globe className="w-4 h-4" />
//             </div>
//             <span className="text-xl font-semibold">Nexus</span>
//           </div>
//           <div className="hidden md:flex items-center space-x-8">
//             <a href="#" className="text-gray-300 hover:text-white transition-colors">Products</a>
//             <a href="#" className="text-gray-300 hover:text-white transition-colors">Solutions</a>
//             <a href="#" className="text-gray-300 hover:text-white transition-colors">Docs</a>
//             <button className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
//               Get Started
//             </button>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="relative min-h-screen flex items-center justify-center px-6">
//         <div className="text-center max-w-4xl mx-auto transform transition-all duration-1000 translate-y-0 opacity-100">
//           <div className="mb-6">
//             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300">
//               <Zap className="w-3 h-3 mr-2" />
//               Now in Public Beta
//             </span>
//           </div>
          
//           <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
//             Build the Future
//             <br />
//             <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//               Deploy Instantly
//             </span>
//           </h1>
          
//           <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
//             The platform for frontend developers, providing the speed and reliability 
//             innovators need to create at the moment of inspiration.
//           </p>
          
//           <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
//             <button className="group bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center">
//               Start Building
//               <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
//             </button>
//             <button className="border border-gray-700 text-white px-8 py-4 rounded-full font-semibold hover:border-gray-500 transition-colors">
//               View Documentation
//             </button>
//           </div>
//         </div>

//         {/* Animated scroll indicator */}
//         <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
//           <ChevronDown className="w-6 h-6 text-gray-500" />
//         </div>

//         {/* Background gradient */}
//         <div className="absolute inset-0 -z-10">
//           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
//           <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-24 px-6">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-bold mb-6">
//               Everything you need to{" "}
//               <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//                 ship faster
//               </span>
//             </h2>
//             <p className="text-xl text-gray-400">
//               The complete toolkit for modern web development
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {features.map((feature, index) => (
//               <div 
//                 key={index}
//                 className="group p-8 rounded-2xl bg-gradient-to-b from-gray-900/50 to-gray-900/20 border border-gray-800 hover:border-gray-700 transition-all duration-500 transform hover:-translate-y-2 opacity-100 translate-y-0"
//               >
//                 <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
//                   <feature.icon className="w-6 h-6" />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
//                 <p className="text-gray-400 leading-relaxed">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Stats Section */}
//       <section className="py-24 px-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
//         <div className="max-w-6xl mx-auto">
//           <div className="grid md:grid-cols-3 gap-12 text-center">
//             <div>
//               <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
//                 10M+
//               </div>
//               <div className="text-gray-400">Deployments</div>
//             </div>
//             <div>
//               <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
//                 99.99%
//               </div>
//               <div className="text-gray-400">Uptime</div>
//             </div>
//             <div>
//               <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
//                 150ms
//               </div>
//               <div className="text-gray-400">Global Latency</div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-24 px-6">
//         <div className="max-w-4xl mx-auto text-center">
//           <h2 className="text-4xl md:text-5xl font-bold mb-6">
//             Ready to get started?
//           </h2>
//           <p className="text-xl text-gray-400 mb-12">
//             Join thousands of developers building the future with our platform
//           </p>
//           <button className="group bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center mx-auto">
//             Deploy your first project
//             <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
//           </button>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="border-t border-gray-800 py-12 px-6">
//         <div className="max-w-6xl mx-auto">
//           <div className="flex flex-col md:flex-row items-center justify-between">
//             <div className="flex items-center space-x-2 mb-6 md:mb-0">
//               <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
//                 <Globe className="w-4 h-4" />
//               </div>
//               <span className="text-xl font-semibold">Nexus</span>
//             </div>
//             <div className="flex items-center space-x-6">
//               <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                 <Github className="w-5 h-5" />
//               </a>
//               <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                 <Twitter className="w-5 h-5" />
//               </a>
//             </div>
//           </div>
//           <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
//             <p>&copy; 2025 Nexus. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
// `.trim();

export const buttonComponent = `
export const Button = ({ children, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={\`bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors \${ className }\`}
    >
      {children}
    </button>
  );
};
`.trim();

export const appJsTemplate = `
import { Button } from '/components/Button';
const App = () => {
  const handleClick = () => {
    alert('Hello from the button!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Hello World!
        </h1>
        <Button onClick={handleClick}>
          Click Me
        </Button>
      </div>
    </div>
  );
};

export default App;
`

