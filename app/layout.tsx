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
  themeColor: "#2563eb",
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
    year: "numeric",
  });

  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-md items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-primary">
                💧 Distribuidora Parise
              </h1>
            <p
              className="mt-1 text-base text-muted-foreground"
              suppressHydrationWarning
            >
                {hoy}
              </p>
            </div>
            <Link
              href="/precios"
              className="flex h-12 min-h-[48px] w-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Configurar precios"
            >
              <Settings className="size-6" />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>

        <BottomNav />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
