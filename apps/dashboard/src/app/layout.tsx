import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { Head } from "nextra/components";

import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mercy — Reversible Infrastructure for AI Agents",
  description:
    "Mercy makes AI agent actions reversible by capturing state before supported actions.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(
          "h-full",
          "antialiased",
          inter.variable,
          jetbrainsMono.variable,
          "font-sans",
          geist.variable,
        )}
      >
        <Head
          color={{
            hue: 111,
            saturation: 100,
            lightness: {
              light: 55,
              dark: 55,
            },
          }}
          backgroundColor={{
            light: "#ffffff",
            dark: "#111111",
          }}
        />
        <body className="min-h-full bg-white font-[family-name:var(--font-inter)] text-black">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}