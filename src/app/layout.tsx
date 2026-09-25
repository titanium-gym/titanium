import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Metadata deliberadamente genérica: app de acceso privado, no queremos que
// una vista previa de enlace (Slack/WhatsApp/Twitter) revele el propósito
// del negocio ni detalles internos. robots.ts ya bloquea la indexación.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Titanium",
  description: "Acceso restringido.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
