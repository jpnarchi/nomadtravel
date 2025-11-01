import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ilovepresentations.ai";

export const metadata = {
  title: "iLovePresentations ",
  description: "iLovePresentations is a platform powered by artificial intelligence that creates presentations automatically, quickly and optimized for any business or project.",
  icons: {
    icon: "/logo.svg"
  },
  openGraph: {
    title: "iLovePresentations - Create your presentation with AI",
    description:
      "iLovePresentations is a platform powered by artificial intelligence that creates presentations automatically, quickly and optimized for any business or project.",
    url: baseUrl,
    type: "website",
    images: [
      {
        url: `${baseUrl}/marketing.jpeg`, // Dynamic URL
        width: 1200,
        height: 630,
        alt: "iLovePresentations - Platform powered by AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "iLovePresentations - Create your presentation with AI",
    description:
      "iLovePresentations is a platform powered by artificial intelligence that creates presentations automatically, quickly and optimized for any business or project.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
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
              forcedTheme="light"
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
