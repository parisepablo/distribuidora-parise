"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatearDinero, ProductoId, PRODUCTOS } from "@/lib/constants";
import { saveRecargaFabrica } from "@/app/actions";
import { Factory } from "lucide-react";

export function RecargaModal({
  precios,
}: {
  precios: { producto: ProductoId; label: string; precio_costo: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];

  const costosMap = useMemo(() => {
    const map = new Map<ProductoId, number>();
    for (const p of precios) {
      map.set(p.producto, p.precio_costo);
    }
    return map;
  }, [precios]);

  const [quantities, setQuantities] = useState<Record<ProductoId, string>>({
    bidon_12: "",
    bidon_20: "",
    cajon_soda: "",
  });
  const [fecha, setFecha] = useState(hoy);
  const [notas, setNotas] = useState("");

  const total = useMemo(() => {
    let sum = 0;
    for (const p of PRODUCTOS) {
      const cantidad = parseInt(quantities[p.id] || "0", 10);
      const costo = costosMap.get(p.id) ?? 0;
      if (!isNaN(cantidad) && cantidad > 0) {
        sum += cantidad * costo;
      }
    }
    return sum;
  }, [quantities, costosMap]);

  function handleQuantityChange(producto: ProductoId, value: string) {
    setQuantities((prev) => ({
      ...prev,
      [producto]: value.replace(/\D/g, ""),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const recargas = PRODUCTOS.map((p) => ({
      producto: p.id,
      cantidad: parseInt(quantities[p.id] || "0", 10),
    })).filter((r) => r.cantidad > 0);

    try {
      await saveRecargaFabrica({
        fecha,
        notas,
        recargas,
      });
      toast.success("✅ Recarga guardada");
      setOpen(false);
      setQuantities({ bidon_12: "", bidon_20: "", cajon_soda: "" });
      setNotas("");
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

  function handleCancel() {
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 w-full gap-2 text-base"
        onClick={() => setOpen(true)}
      >
        <Factory className="size-5" />
        Registrar recarga en fábrica
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Recarga en fábrica</SheetTitle>
            <SheetDescription className="text-base">
              ¿Cuántos productos cargaste hoy en la fábrica?
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
            <div className="space-y-4">
              {PRODUCTOS.map((p) => {
                const cantidad = quantities[p.id] || "";
                const costo = costosMap.get(p.id) ?? 0;
                const subtotal = costo * (parseInt(cantidad || "0", 10) || 0);

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="mb-3 flex items-center gap-2 text-base font-medium">
                      <span className="text-xl">
                        {p.id === "cajon_soda" ? "🫧" : "💧"}
                      </span>
                      {p.label}
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        value={cantidad}
                        onChange={(e) =>
                          handleQuantityChange(p.id, e.target.value)
                        }
                        className="h-14 min-w-0 flex-1 text-center text-2xl"
                      />
                      <div className="min-w-0 text-right text-base leading-tight text-muted-foreground">
                        <p>× {formatearDinero(costo)} costo c/u</p>
                        <p className="font-semibold text-foreground">
                          = {formatearDinero(subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-lg font-semibold text-primary">
              Total a pagar en fábrica: {formatearDinero(total)}
            </p>

            <div className="space-y-2">
              <Label htmlFor="recarga-fecha" className="text-base">
                Fecha
              </Label>
              <Input
                id="recarga-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recarga-notas" className="text-base">
                Notas
              </Label>
              <textarea
                id="recarga-notas"
                rows={2}
                placeholder="Ej: pagué en efectivo, faltaron cajones…"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || total <= 0}
                className="h-14 w-full gap-2 text-lg"
              >
                {loading ? "Guardando..." : "Guardar recarga"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="h-12 w-full text-base"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
