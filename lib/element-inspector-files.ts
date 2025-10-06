const appJs = `import { useState, useCallback } from 'react';

export default function App() {
    const [count, setCount] = useState(0);

    const increment = useCallback(() => {
        setCount(c => c + 1);
    }, []);

    const decrement = useCallback(() => {
        setCount(c => c - 1);
    }, []);

    const reset = useCallback(() => {
        setCount(0);
    }, []);

    const getCountColor = () => {
        if (count > 0) return 'text-green-600';
        if (count < 0) return 'text-red-600';
        return 'text-gray-800';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
                    Counter App
                </h1>
                
                <div className={\`text-7xl font-bold my-12 text-center transition-colors duration-300 \${ getCountColor() }\`}>
                    {count}
                </div>
                
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={decrement}
                        className="px-6 py-3 text-lg font-semibold bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg active:scale-95 transition-all duration-200"
                        aria-label="Decrement counter"
                    >
                        −
                    </button>
                    <button 
                        onClick={reset}
                        className="px-6 py-3 text-lg font-semibold bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg active:scale-95 transition-all duration-200"
                        aria-label="Reset counter"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={increment}
                        className="px-6 py-3 text-lg font-semibold bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 hover:shadow-lg active:scale-95 transition-all duration-200"
                        aria-label="Increment counter"
                    >
                        +
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Click the buttons to change the counter value
                </div>
            </div>
        </div>
    );
}`
export const indexJs = `import React, { StrictMode } from "react";
        import { createRoot } from "react-dom/client";
        import "./styles.css";
        import ElementInspector from "./components/ElementInspector";

        import App from "./App";

        const root = createRoot(document.getElementById("root"));
        root.render(
            <StrictMode>
                <ElementInspector>
                    <App />
                </ElementInspector>
            </StrictMode>
        );`

export const toasterIndexJs = `import React, { StrictMode } from "react";
        import { createRoot } from "react-dom/client";
        import "./styles.css";
        import ElementInspector from "./components/ElementInspector";
        import { Toaster } from "/components/ui/Sonner"

        import App from "./App";

        const root = createRoot(document.getElementById("root"));
        root.render(
            <StrictMode>
                <ElementInspector>
                    <App />
                    <Toaster />
                </ElementInspector>
            </StrictMode>
        );`
const packageJson = `{
            "dependencies": {
                "react": "^19.0.0",
                "react-dom": "^19.0.0",
                "react-scripts": "^5.0.0"
            },
            "main": "/index.js",
            "devDependencies": {}
        }`
const publicIndexHtml = `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
            </head>
            <body>
                <div id="root"></div>
            </body>
        </html>`
const stylesCss = `body {
            font-family: sans-serif;
            -webkit-font-smoothing: auto;
            -moz-font-smoothing: auto;
            -moz-osx-font-smoothing: grayscale;
            font-smoothing: auto;
            text-rendering: optimizeLegibility;
            font-smooth: always;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
        }
        h1 {
            font-size: 1.5rem;
        }`

export const elementInspectorJs = `
import React, { useState, useEffect, useRef } from 'react';

const ElementInspector = ({ children, buttonPosition = 'top-right' }) => {
  const [isInspecting, setIsInspecting] = useState(false);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const originalStyles = useRef(new Map());

  useEffect(() => {
    const handleMouseOver = (e) => {
      if (!isInspecting) return;
      
      // Skip if hovering over inspector UI
      if (e.target.closest('[data-inspector-ui]')) return;
      
      e.stopPropagation();
      setHoveredElement(e.target);
    };

    const handleMouseOut = (e) => {
      if (!isInspecting) return;
      
      e.stopPropagation();
      setHoveredElement(null);
    };

    const handleClick = (e) => {
      if (!isInspecting) return;
      
      // Skip if clicking on inspector UI
      if (e.target.closest('[data-inspector-ui]')) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Select the element
      setSelectedElement(e.target);
      
      // Store original styles for restoration
      const computedStyles = window.getComputedStyle(e.target);
      originalStyles.current.set(e.target, {
        color: computedStyles.color,
        backgroundColor: computedStyles.backgroundColor,
        fontSize: computedStyles.fontSize,
        fontWeight: computedStyles.fontWeight,
        padding: computedStyles.padding,
        margin: computedStyles.margin,
        borderRadius: computedStyles.borderRadius,
        border: computedStyles.border,
        textContent: e.target.textContent,
        display: computedStyles.display,
        flexDirection: computedStyles.flexDirection,
        justifyContent: computedStyles.justifyContent,
        alignItems: computedStyles.alignItems
      });
      
      // Turn off inspector and show AI input
      setIsInspecting(false);
      setHoveredElement(null);
      setShowAIInput(true);
    };

    if (isInspecting) {
      document.addEventListener('mouseover', handleMouseOver, true);
      document.addEventListener('mouseout', handleMouseOut, true);
      document.addEventListener('click', handleClick, true);
      document.body.style.cursor = 'crosshair';
    }

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleClick, true);
      document.body.style.cursor = 'default';
    };
  }, [isInspecting]);

  // Apply highlight styles to hovered element
  useEffect(() => {
    if (hoveredElement && isInspecting) {
      hoveredElement.style.outline = '3px solid #000';
      hoveredElement.style.outlineOffset = '2px';
      hoveredElement.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
    }

    return () => {
      if (hoveredElement) {
        hoveredElement.style.outline = '';
        hoveredElement.style.outlineOffset = '';
        hoveredElement.style.backgroundColor = '';
      }
    };
  }, [hoveredElement, isInspecting]);

  // Apply persistent highlight to selected element while AI input is open
  useEffect(() => {
    if (selectedElement && showAIInput) {
      selectedElement.style.outline = '3px solid #000';
      selectedElement.style.outlineOffset = '2px';
      selectedElement.style.boxShadow = '0 0 0 4px rgba(0, 0, 0, 0.1)';
    }

    return () => {
      if (selectedElement && !isInspecting) {
        selectedElement.style.outline = '';
        selectedElement.style.outlineOffset = '';
        selectedElement.style.boxShadow = '';
      }
    };
  }, [selectedElement, showAIInput, isInspecting]);

  const getButtonPositionClasses = () => {
    switch (buttonPosition) {
      case 'top-left': return 'top-2 left-2';
      case 'top-right': return 'top-2 right-2';
      case 'bottom-left': return 'bottom-2 left-2';
      case 'bottom-right': return 'bottom-2 right-2';
      default: return 'top-2 right-2';
    }
  };

  const toggleInspector = () => {
    if (showAIInput) {
      // If AI input is open, close it first
      closeAIInput();
    }
    setIsInspecting(!isInspecting);
    if (hoveredElement) {
      hoveredElement.style.outline = '';
      hoveredElement.style.outlineOffset = '';
      hoveredElement.style.backgroundColor = '';
      setHoveredElement(null);
    }
  };

  const processAIRequest = async () => {
    if (!aiPrompt.trim() || !selectedElement) return;

    console.log('CLOSE INSPECTION')

    const output = \`
Selected Element:
Tag: \${ selectedElement.tagName.toLowerCase() }
ID: \${ selectedElement.id || null }
Classes: \${ selectedElement.className || null }
Text: \${ selectedElement.textContent?.trim().slice(0, 50) || null }

User Request:
User Input: \${ aiPrompt }
\`
    
    console.log(output);
    
    closeAIInput();
  };

  const resetElement = () => {
    if (selectedElement && originalStyles.current.has(selectedElement)) {
      const original = originalStyles.current.get(selectedElement);
      Object.keys(original).forEach(key => {
        if (key === 'textContent') {
          selectedElement.textContent = original[key];
        } else {
          selectedElement.style[key] = original[key];
        }
      });
    }
  };

  const getElementPosition = () => {
    if (!selectedElement) return { top: 0, left: 0 };
    
    const rect = selectedElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = 320; // AI input panel width
    const panelHeight = 60; // Approximate height of panel
    const gap = 8;
    const margin = 16; // Minimum margin from viewport edges
    
    let top = rect.bottom + gap;
    let left = rect.left;
    
    // Vertical positioning with improved logic
    if (top + panelHeight > viewportHeight - margin) {
      // Try positioning above the element
      const topPosition = rect.top - panelHeight - gap;
      if (topPosition >= margin) {
        top = topPosition;
      } else {
        // If neither above nor below fits well, choose the best option
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        if (spaceBelow > spaceAbove) {
          // Position at bottom with some margin
          top = Math.max(rect.bottom + gap, viewportHeight - panelHeight - margin);
        } else {
          // Position at top with some margin
          top = Math.max(margin, rect.top - panelHeight - gap);
        }
      }
    }
    
    // Horizontal positioning based on element's position on screen
    const elementCenter = rect.left + (rect.width / 2);
    const screenCenter = viewportWidth / 2;
    
    if (elementCenter <= screenCenter) {
      // Element is on LEFT side of screen - align panel to LEFT edge of element
      left = rect.left;
      
      // Ensure panel doesn't go off left edge
      if (left < margin) {
        left = margin;
      }
      // Ensure panel doesn't go off right edge
      if (left + panelWidth > viewportWidth - margin) {
        left = viewportWidth - panelWidth - margin;
      }
    } else {
      // Element is on RIGHT side of screen - align panel to RIGHT edge of element
      left = rect.right - panelWidth;
      
      // Ensure panel doesn't go off right edge
      if (left + panelWidth > viewportWidth - margin) {
        left = viewportWidth - panelWidth - margin;
      }
      // Ensure panel doesn't go off left edge
      if (left < margin) {
        left = margin;
      }
    }
    
    return { top, left };
  };

  // Update position when AI input is shown and on scroll/resize
  useEffect(() => {
    if (!showAIInput || !selectedElement) return;

    const updatePanelPosition = () => {
      const panel = document.querySelector('[data-ai-input-panel]');
      if (panel) {
        const position = getElementPosition();
        panel.style.top = \`\${ position.top }px\`;
        panel.style.left = \`\${ position.left }px\`;
        
        // Make sure panel is visible
        panel.style.visibility = 'visible';
        panel.style.opacity = '1';
      }
    };

    // Multiple update triggers for reliability
    const updateTriggers = [
      () => setTimeout(updatePanelPosition, 0),
      () => setTimeout(updatePanelPosition, 10),
      () => setTimeout(updatePanelPosition, 50),
      () => requestAnimationFrame(updatePanelPosition),
    ];

    updateTriggers.forEach(trigger => trigger());
    
    // Add scroll and resize listeners with throttling
    let ticking = false;
    const handlePositionUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updatePanelPosition();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handlePositionUpdate, { passive: true });
    window.addEventListener('resize', handlePositionUpdate, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handlePositionUpdate);
      window.removeEventListener('resize', handlePositionUpdate);
    };
  }, [showAIInput, selectedElement]);

  const closeAIInput = () => {
    // Clean up selected element highlight
    if (selectedElement) {
      selectedElement.style.outline = '';
      selectedElement.style.outlineOffset = '';
      selectedElement.style.boxShadow = '';
    }
    setShowAIInput(false);
    setSelectedElement(null);
    setAiPrompt('');
    setIsInspecting(false);
    console.log('CLOSE INSPECTION')
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processAIRequest();
    }
  };

  return (
    <div className="relative">
      {children}
      
      {/* Toggle Inspector Button */}
      <button
        onClick={toggleInspector}
        data-inspector-ui
        className={\`fixed \${ getButtonPositionClasses()} z-50 w-10 h-10 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-600/90 transition-all flex items-center justify-center\`}
        title={isInspecting ? "Stop Inspecting" : "Start Inspecting"}
      >
        {isInspecting ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z"/>
          </svg>
        )}
      </button>
      
      {/* AI Input Panel - Positioned relative to selected element */}
      {showAIInput && selectedElement && (
        <div 
          className="fixed z-50 transition-all duration-200" 
          data-inspector-ui
          data-ai-input-panel
          style={{ 
            width: '320px',
            top: \`\${ getElementPosition().top }px\`, 
            left: \`\${ getElementPosition().left }px\`,
            visibility: 'hidden',
            opacity: '0'
          }}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl">
            <div className="flex items-center gap-2 p-3">
              {/* Close button (X) */}
              <button
                onClick={closeAIInput}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-sm hover:bg-gray-100"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="¿Qué quieres cambiar?"
                className="flex-1 px-3 py-1 text-black text-[16px] border-0 focus:outline-none placeholder-gray-400"
                disabled={isProcessing}
                autoFocus
              />
              <button
                onClick={processAIRequest}
                disabled={!aiPrompt.trim() || isProcessing}
                className="px-2 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3L13 8L11.5 9.5L9 7V13H7V7L4.5 9.5L3 8L8 3Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementInspector;
`

export const elementInspectorFiles = {
    "/App.js": appJs,
    "/index.js": indexJs,
    "/package.json": packageJson,
    "/public/index.html": publicIndexHtml,
    "/styles.css": stylesCss,
    "/components/ElementInspector.js": elementInspectorJs,
}