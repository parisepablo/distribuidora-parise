"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, AlertTriangle, TrendingUp } from "lucide-react";

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

const ICONOS_PRODUCTO: Record<ProductoId, string> = {
  bidon_12: "💧",
  bidon_20: "💧",
  cajon_soda: "🫧",
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
        err instanceof Error
          ? err.message
          : "Algo salió mal. Revisá tu conexión e intentá de nuevo."
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
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Resumen del día</h2>
          <p className="text-base text-muted-foreground">
            Esto es lo que registraste hoy.
          </p>
        </div>

        <Card className="border-border bg-gradient-to-br from-card to-secondary/30">
          <CardHeader className="p-5 pb-3">
            <CardDescription className="text-base">
              Hoy cobré
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-success">
              {formatearDinero(registro.total_cobrado)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0">
            {ventasGuardadas.length > 0 && (
              <div className="rounded-xl bg-secondary/50 p-5">
                <p className="mb-2 text-base font-medium">Ventas registradas</p>
                <ul className="space-y-2 text-base">
                  {ventasGuardadas.map((v) => (
                    <li
                      key={v.producto}
                      className="flex items-center justify-between"
                    >
                      <span className="text-muted-foreground">
                        {v.cantidad}{" "}
                        {etiquetaProducto(v.producto).toLowerCase()}
                      </span>
                      <span className="font-medium">
                        {formatearDinero(v.cantidad * v.precio_unitario)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {registro.notas && (
              <div className="rounded-xl bg-secondary/50 p-5">
                <p className="text-base leading-relaxed text-foreground">
                  {registro.notas}
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-14 w-full gap-2 text-base"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-5" />
              Editar día
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
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          ¿Cómo te fue hoy?
        </h2>
        <p className="text-base text-muted-foreground">
          Cargá las ventas y el total cobrado.
        </p>
      </div>

      {!preciosConfigurados && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5 text-danger">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-6 shrink-0" />
            <div>
              <p className="text-base font-semibold">
                Configurá tus precios antes de empezar
              </p>
              <Link
                href="/precios"
                className="mt-1 inline-block text-base underline underline-offset-2"
              >
                Ir a configurar precios
              </Link>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg">Lo que vendiste hoy</CardTitle>
            <CardDescription className="text-base">
              Opcional. Si no vendiste nada, dejá todo en 0.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {PRODUCTOS.map((p) => {
              const cantidad = quantities.get(p.id) || "";
              const precio = preciosMap.get(p.id) ?? 0;
              const subtotal = precio * (parseInt(cantidad || "0", 10) || 0);

              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl bg-secondary/40 p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl">
                    {ICONOS_PRODUCTO[p.id]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium">{p.label}</p>
                    <p className="text-sm text-muted-foreground">
                      × {formatearDinero(precio)} c/u
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={cantidad}
                      onChange={(e) =>
                        handleQuantityChange(p.id, e.target.value)
                      }
                      className="h-12 w-20 text-center text-xl"
                    />
                    <p className="text-sm font-semibold">
                      = {formatearDinero(subtotal)}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between rounded-xl bg-primary/10 p-5">
              <span className="text-base font-medium text-primary-foreground/80">
                Subtotal calculado
              </span>
              <span className="text-xl font-bold text-primary">
                {formatearDinero(subtotalCalculado)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg">Total cobrado en efectivo</CardTitle>
            <CardDescription className="text-base">
              Podés modificarlo si cobraste otro monto.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
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
                className="h-16 pl-10 text-3xl font-bold tracking-tight"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg">Notas del día</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <textarea
              id="notas"
              rows={3}
              placeholder="Ej: llovió, faltaron bidones en la zona norte…"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="h-14 w-full gap-2 text-lg shadow-lg shadow-primary/20"
        >
          <TrendingUp className="size-6" />
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
