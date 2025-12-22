// Type definitions for Meta Pixel (Facebook Pixel)
declare global {
  interface Window {
    fbq: (
      action: "track" | "trackCustom" | "init",
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq: typeof window.fbq;
  }
}

export {};
