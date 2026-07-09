import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { formatearFecha } from "@/lib/constants";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Distribuidora Parise",
  description: "Control diario de entregas de agua",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b1121",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hoy = formatearFecha(new Date(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-5 backdrop-blur">
          <div className="mx-auto flex max-w-md items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                💧 Distribuidora Parise
              </h1>
              <p
                className="mt-1 text-base capitalize text-muted-foreground"
                suppressHydrationWarning
              >
                {hoy}
              </p>
            </div>
            <Link
              href="/precios"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Configurar precios"
            >
              <Settings className="size-6" />
            </Link>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-10rem)] max-w-md px-5 pb-32 pt-6">
          {children}
        </main>

        <BottomNav />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: "text-base",
          }}
        />
      </body>
    </html>
  );
}
