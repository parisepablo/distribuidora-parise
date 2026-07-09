"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatearFecha, ProductoId } from "@/lib/constants";
import { savePrecio } from "@/app/actions";
import { Save } from "lucide-react";

const ICONOS_PRODUCTO: Record<ProductoId, string> = {
  bidon_12: "💧",
  bidon_20: "💧",
  cajon_soda: "🫧",
};

export function PrecioCard({
  producto,
  label,
  precioCosto,
  precioVenta,
  ultimaFecha,
}: {
  producto: ProductoId;
  label: string;
  precioCosto: number;
  precioVenta: number;
  ultimaFecha: string | null;
}) {
  const router = useRouter();
  const hoy = new Date().toISOString().split("T")[0];

  const [costo, setCosto] = useState<string>(
    precioCosto > 0 ? String(precioCosto) : ""
  );
  const [venta, setVenta] = useState<string>(
    precioVenta > 0 ? String(precioVenta) : ""
  );
  const [loading, setLoading] = useState(false);

  function limpiarNumero(value: string) {
    return value.replace(/[^0-9]/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await savePrecio({
        producto,
        precio_costo: parseInt(costo || "0", 10),
        precio_venta: parseInt(venta || "0", 10),
      });
      toast.success(`✅ Precio de ${label} guardado`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Algo salió mal. Revisá tu conexión e intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-2xl">
            {ICONOS_PRODUCTO[producto]}
          </span>
          <div>
            <CardTitle className="text-xl">{label}</CardTitle>
            <CardDescription className="text-base">
              Cuando guardes, el precio anterior queda en el historial.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`costo-${producto}`} className="text-base">
                Precio de costo
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
                  $
                </span>
                <Input
                  id={`costo-${producto}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  required
                  value={costo}
                  onChange={(e) => setCosto(limpiarNumero(e.target.value))}
                  className="h-14 pl-9 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`venta-${producto}`} className="text-base">
                Precio de venta
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
                  $
                </span>
                <Input
                  id={`venta-${producto}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  required
                  value={venta}
                  onChange={(e) => setVenta(limpiarNumero(e.target.value))}
                  className="h-14 pl-9 text-lg"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="text-sm text-muted-foreground">Vigente desde</p>
            <p className="text-base font-medium">
              {formatearFecha(hoy, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-14 w-full gap-2 text-base shadow-lg shadow-primary/20"
          >
            <Save className="size-5" />
            {loading ? "Guardando..." : "Guardar precio"}
          </Button>
        </form>

        {ultimaFecha && (
          <p className="text-center text-base text-muted-foreground">
            Precio actual desde{" "}
            {formatearFecha(ultimaFecha, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
