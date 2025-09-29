const appJs = `export default function App() {
            return <h1>Hello leon</h1>
        }`
const indexJs = `import React, { StrictMode } from "react";
        import { createRoot } from "react-dom/client";
        import "./styles.css";

        import App from "./App";

        const root = createRoot(document.getElementById("root"));
        root.render(
            <StrictMode>
                <App />
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


export const defaultFiles = {
    "/App.js": appJs,
    "/index.js": indexJs,
    "/package.json": packageJson,
    "/public/index.html": publicIndexHtml,
    "/styles.css": stylesCss,
}