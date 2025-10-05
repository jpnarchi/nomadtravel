import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/providers/convex-client-provider";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { esES } from '@clerk/localizations'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nuevonerd.lat";

export const metadata = {
  title: "Nerd ",
  description: "Nerd es una plataforma impulsada por inteligencia artificial que crea sitios web de manera automática, rápida y optimizada para cualquier negocio o proyecto.",
  icons: {
    icon: "/lentes.svg"
  },
  openGraph: {
    title: "Nerd - Crea tu sitio web con IA",
    description:
      "Nerd es una plataforma impulsada por inteligencia artificial que crea sitios web de manera automática, rápida y optimizada.",
    url: baseUrl,
    type: "website",
    images: [
      {
        url: `${baseUrl}/marketing.jpeg`, // Dynamic URL
        width: 1200,
        height: 630,
        alt: "Nerd - Plataforma impulsada por IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nerd - Crea tu sitio web con IA",
    description:
      "Nerd es una plataforma impulsada por inteligencia artificial que crea sitios web de manera automática, rápida y optimizada.",
    images: [`${baseUrl}/marketing.jpeg`], // Dynamic URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{
            theme: shadcn,
          }}
          localization={esES}
        >
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
