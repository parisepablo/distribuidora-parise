"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import {
  formatearDinero,
  ProductoId,
  PRODUCTOS,
  etiquetaProducto,
} from "@/lib/constants";
import { saveRegistroDiario } from "@/app/actions";
import { RecargaModal } from "@/components/recarga-modal";
import { GastoModal } from "@/components/gasto-modal";
import { Package, Pencil, AlertTriangle } from "lucide-react";

type Precio = {
  producto: ProductoId;
  label: string;
  precio_costo: number;
  precio_venta: number;
};

type VentaGuardada = {
  producto: ProductoId;
  cantidad: number;
  precio_unitario: number;
};

type Registro = {
  id: string;
  fecha: string;
  total_cobrado: number;
  notas: string | null;
  ventas: VentaGuardada[];
};

export function InicioForm({
  precios,
  registro,
}: {
  precios: Precio[];
  registro: Registro | null;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!registro);

  const preciosMap = useMemo(() => {
    const map = new Map<ProductoId, number>();
    for (const p of precios) {
      map.set(p.producto, p.precio_venta);
    }
    return map;
  }, [precios]);

  const initialQuantities = useMemo(() => {
    const map = new Map<ProductoId, string>();
    for (const p of PRODUCTOS) {
      const venta = registro?.ventas.find((v) => v.producto === p.id);
      map.set(p.id, venta ? String(venta.cantidad) : "");
    }
    return map;
  }, [registro]);

  const [quantities, setQuantities] = useState<Map<ProductoId, string>>(
    initialQuantities
  );
  const [totalCobrado, setTotalCobrado] = useState<string>(
    registro ? String(registro.total_cobrado) : ""
  );
  const [totalManual, setTotalManual] = useState(false);
  const [notas, setNotas] = useState<string>(registro?.notas ?? "");
  const [loading, setLoading] = useState(false);

  const subtotalCalculado = useMemo(() => {
    let total = 0;
    for (const p of PRODUCTOS) {
      const cantidad = parseInt(quantities.get(p.id) || "0", 10);
      const precio = preciosMap.get(p.id) ?? 0;
      if (!isNaN(cantidad) && cantidad > 0) {
        total += cantidad * precio;
      }
    }
    return total;
  }, [quantities, preciosMap]);

  function handleQuantityChange(producto: ProductoId, value: string) {
    const cleaned = value.replace(/\D/g, "");
    const next = new Map(quantities);
    next.set(producto, cleaned);
    setQuantities(next);

    if (!totalManual) {
      let nuevoSubtotal = 0;
      for (const p of PRODUCTOS) {
        const cantidad = parseInt(
          p.id === producto ? cleaned : next.get(p.id) || "0",
          10
        );
        const precio = preciosMap.get(p.id) ?? 0;
        if (!isNaN(cantidad) && cantidad > 0) {
          nuevoSubtotal += cantidad * precio;
        }
      }
      setTotalCobrado(nuevoSubtotal > 0 ? String(nuevoSubtotal) : "");
    }
  }

  function handleTotalChange(value: string) {
    const cleaned = value.replace(/[^0-9]/g, "");
    setTotalCobrado(cleaned);
    setTotalManual(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const ventas = PRODUCTOS.map((p) => ({
      producto: p.id,
      cantidad: parseInt(quantities.get(p.id) || "0", 10),
    }));

    try {
      await saveRegistroDiario({
        total_cobrado: parseInt(totalCobrado || "0", 10),
        notas,
        ventas,
      });
      toast.success("✅ Día guardado");
      setIsEditing(false);
      setTotalManual(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ocurrió un error al guardar"
      );
    } finally {
      setLoading(false);
    }
  }

  const preciosConfigurados = precios.some((p) => p.precio_venta > 0);
  const ventasGuardadas = registro?.ventas.filter((v) => v.cantidad > 0) ?? [];

  if (!isEditing && registro) {
    return (
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Resumen del día</h2>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-base">
              Hoy cobré
            </CardDescription>
            <CardTitle className="text-3xl text-success">
              {formatearDinero(registro.total_cobrado)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ventasGuardadas.length > 0 && (
              <div className="space-y-2">
                <p className="text-base font-medium text-foreground">
                  Ventas registradas
                </p>
                <ul className="space-y-1 text-base text-muted-foreground">
                  {ventasGuardadas.map((v) => (
                    <li key={v.producto} className="flex justify-between">
                      <span>
                        {v.cantidad} {etiquetaProducto(v.producto).toLowerCase()}
                      </span>
                      <span>{formatearDinero(v.cantidad * v.precio_unitario)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {registro.notas && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-base text-foreground">{registro.notas}</p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 w-full gap-2 text-base"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-5" />
              Editar
            </Button>

            <div className="grid gap-3 pt-2">
              <RecargaModal precios={precios} />
              <GastoModal />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold">¿Cómo te fue hoy?</h2>

      {!preciosConfigurados && (
        <div className="rounded-lg border border-dashed border-danger/30 bg-red-50 p-4 text-danger">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-6 shrink-0" />
            <div>
              <p className="text-base font-medium">
                Configurá tus precios antes de empezar
              </p>
              <Link
                href="/precios"
                className="mt-1 inline-block text-base underline"
              >
                Ir a configurar precios
              </Link>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Lo que vendiste hoy</h3>
          <p className="text-base text-muted-foreground">
            Opcional. Si hoy no vendiste productos, dejá todo en 0.
          </p>

          <div className="space-y-4">
            {PRODUCTOS.map((p) => {
              const cantidad = quantities.get(p.id) || "";
              const precio = preciosMap.get(p.id) ?? 0;
              const subtotal = precio * (parseInt(cantidad || "0", 10) || 0);

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
                      <p>× {formatearDinero(precio)} c/u</p>
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
            Subtotal calculado: {formatearDinero(subtotalCalculado)}
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="total-cobrado" className="text-xl font-semibold">
            Total cobrado en efectivo
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
              $
            </span>
            <Input
              id="total-cobrado"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              required
              value={totalCobrado}
              onChange={(e) => handleTotalChange(e.target.value)}
              className="h-16 pl-10 text-3xl font-semibold"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="notas" className="text-lg font-medium">
            Notas del día
          </Label>
          <textarea
            id="notas"
            rows={3}
            placeholder="Ej: llovió, faltaron bidones en la zona norte…"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="h-14 w-full gap-2 text-lg"
        >
          <Package className="size-6" />
          {loading ? "Guardando..." : "Guardar día"}
        </Button>

        <div className="grid gap-3">
          <RecargaModal precios={precios} />
          <GastoModal />
        </div>
      </form>
    </section>
  );
}
