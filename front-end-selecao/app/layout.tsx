import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import ThemedToaster from "@/components/theme/ThemedToaster";
import { themeInitScript } from "@/components/theme/initScript";
import "./globals.css";
import Providers from "./providers";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seleção Simplificada • Portal Oficial",
  description: "Sistema e Portal de Seleção de Estagiários da Seleção Simplificada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen">
        <Providers>
          {children}
          <ThemedToaster />
        </Providers>
      </body>
    </html>
  );
}
