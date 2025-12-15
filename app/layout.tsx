import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Roboto, Open_Sans, Montserrat, Poppins, Lato, Raleway } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/providers/convex-client-provider";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import { enUS } from '@clerk/localizations'

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

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  weight: ['100', '300', '400', '700', '900'],
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const esbuildBold = localFont({
  src: "./fonts/ESBuild-Bold.woff2",
  variable: "--font-esbuild-bold",
  display: "swap",
});

const ppmoriMedium = localFont({
  src: "./fonts/PPMori-Medium.woff2",
  variable: "--font-ppmori-medium",
  display: "swap",
});

const ppmoriSemiBold = localFont({
  src: "./fonts/PPMori-SemiBold.woff2",
  variable: "--font-ppmori-semibold",
  display: "swap",
});

const theSeasonsBold = localFont({
  src: "./fonts/The-Seasons-Bold.ttf",
  variable: "--font-the-seasons-bold",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ilovepresentations.io";

export const metadata = {
  title: "iLovePresentations ",
  description: "iLovePresentations is a platform powered by artificial intelligence that creates presentations automatically, quickly and optimized for any business or project.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.svg", type: "image/svg+xml" }
    ],
    apple: "/logo.png",
    shortcut: "/favicon.ico"
  },
  manifest: "/manifest.json",
  themeColor: "#E5332D",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto.variable} ${openSans.variable} ${montserrat.variable} ${poppins.variable} ${lato.variable} ${raleway.variable} ${esbuildBold.variable} ${ppmoriMedium.variable} ${ppmoriSemiBold.variable} ${theSeasonsBold.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{
            theme: shadcn,
          }}
          localization={enUS}
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
