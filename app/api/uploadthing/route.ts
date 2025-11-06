import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Exportar rutas para Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Log all events for debugging
    logLevel: "Debug",
    // Callback URL for local development
    callbackUrl: process.env.UPLOADTHING_URL,
  },
});

// Ensure the route can handle large payloads
export const runtime = 'nodejs';
export const maxDuration = 30;
