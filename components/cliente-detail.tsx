"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/map-view";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  formatearDinero,
  formatearFecha,
  ProductoId,
  PRODUCTOS,
  etiquetaProducto,
} from "@/lib/constants";
import { saveTransaccionCliente } from "@/app/actions";
import {
  Phone,
  MapPin,
  FileText,
  Package,
  Banknote,
  CheckCircle2,
} from "lucide-react";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  notas: string | null;
};

type Transaccion = {
  id: string;
  tipo: "entrega" | "pago";
  producto: ProductoId | null;
  cantidad: number | null;
  monto: number;
  precio_unitario: number | null;
  fecha: string;
  notas: string | null;
};

export function ClienteDetail({
  cliente,
  transacciones,
}: {
  cliente: Cliente;
  transacciones: Transaccion[];
}) {
  const balance = useMemo(() => {
    return transacciones.reduce((sum, t) => {
      if (t.tipo === "entrega") return sum + t.monto;
      return sum - t.monto;
    }, 0);
  }, [transacciones]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">{cliente.nombre}</h2>
        {cliente.telefono && (
          <p className="flex items-center gap-2 text-base text-muted-foreground">
            <Phone className="size-5" />
            {cliente.telefono}
          </p>
        )}
        {cliente.direccion && (
          <p className="flex items-center gap-2 text-base text-muted-foreground">
            <MapPin className="size-5" />
            {cliente.direccion}
          </p>
        )}
      </div>

      {cliente.lat != null && cliente.lng != null ? (
        <MapView
          lat={cliente.lat}
          lng={cliente.lng}
          label={cliente.direccion ?? undefined}
        />
      ) : (
        cliente.direccion && (
          <a
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
              cliente.direccion
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-border bg-card p-4 text-base text-primary underline"
          >
            Ver dirección en OpenStreetMap
          </a>
        )
      )}

      {cliente.notas && (
        <div className="rounded-lg bg-muted p-4">
          <p className="flex items-start gap-2 text-base text-foreground">
            <FileText className="mt-0.5 size-5 shrink-0" />
            {cliente.notas}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Cuenta corriente</h3>
        {balance === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-success">
            <CheckCircle2 className="size-7" />
            Al día
          </p>
        ) : balance > 0 ? (
          <p className="mt-2 text-2xl font-bold text-danger">
            Debe {formatearDinero(balance)}
          </p>
        ) : (
          <p className="mt-2 text-2xl font-bold text-success">
            A favor {formatearDinero(Math.abs(balance))}
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <EntregaModal clienteId={cliente.id} />
          <PagoModal clienteId={cliente.id} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Movimientos</h3>
        {transacciones.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-6 text-center text-base text-muted-foreground">
            No hay movimientos registrados.
          </p>
        ) : (
          transacciones.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="text-base font-medium">
                  {t.tipo === "entrega"
                    ? `Entrega: ${t.cantidad ?? 0} ${etiquetaProducto(
                        t.producto as ProductoId
                      ).toLowerCase()}`
                    : "Pago"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatearFecha(t.fecha, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <p
                className={`text-xl font-bold ${
                  t.tipo === "entrega" ? "text-danger" : "text-success"
                }`}
              >
                {t.tipo === "entrega" ? "+" : "-"}
                {formatearDinero(t.monto)}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EntregaModal({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hoy = new Date().toISOString().split("T")[0];

  const [producto, setProducto] = useState<ProductoId>("bidon_12");
  const [cantidad, setCantidad] = useState("1");
  const [monto, setMonto] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [notas, setNotas] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await saveTransaccionCliente({
        clienteId,
        tipo: "entrega",
        producto,
        cantidad: parseInt(cantidad || "0", 10),
        monto: parseInt(monto || "0", 10),
        precio_unitario: precioUnitario ? parseInt(precioUnitario, 10) : undefined,
        fecha,
        notas,
      });
      toast.success("✅ Entrega guardada");
      setOpen(false);
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
    <>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-2 text-base"
        onClick={() => setOpen(true)}
      >
        <Package className="size-5" />
        Apuntar entrega
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Apuntar entrega</SheetTitle>
            <SheetDescription className="text-base">
              Registrá una entrega para este cliente.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-4"
          >
            <div className="space-y-2">
              <Label className="text-base">Producto</Label>
              <div className="grid grid-cols-1 gap-2">
                {PRODUCTOS.map((p) => (
                  <Button
                    key={p.id}
                    type="button"
                    variant={producto === p.id ? "default" : "outline"}
                    onClick={() => setProducto(p.id)}
                    className="h-12 justify-start text-base"
                  >
                    {p.id === "cajon_soda" ? "🫧" : "💧"} {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="entrega-cantidad" className="text-base">
                  Cantidad
                </Label>
                <Input
                  id="entrega-cantidad"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(e.target.value.replace(/\D/g, ""))
                  }
                  className="h-12 text-center text-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entrega-precio" className="text-base">
                  Precio unitario
                </Label>
                <Input
                  id="entrega-precio"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Opcional"
                  value={precioUnitario}
                  onChange={(e) =>
                    setPrecioUnitario(e.target.value.replace(/\D/g, ""))
                  }
                  className="h-12 text-center text-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entrega-monto" className="text-base">
                Monto total
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                  $
                </span>
                <Input
                  id="entrega-monto"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
                  className="h-14 pl-10 text-2xl font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entrega-fecha" className="text-base">
                Fecha
              </Label>
              <Input
                id="entrega-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entrega-notas" className="text-base">
                Notas
              </Label>
              <textarea
                id="entrega-notas"
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full gap-2 text-lg"
              >
                {loading ? "Guardando..." : "Guardar entrega"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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

function PagoModal({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hoy = new Date().toISOString().split("T")[0];

  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [notas, setNotas] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await saveTransaccionCliente({
        clienteId,
        tipo: "pago",
        monto: parseInt(monto || "0", 10),
        fecha,
        notas,
      });
      toast.success("✅ Pago guardado");
      setOpen(false);
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
    <>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-2 text-base"
        onClick={() => setOpen(true)}
      >
        <Banknote className="size-5" />
        Apuntar pago
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Apuntar pago</SheetTitle>
            <SheetDescription className="text-base">
              Registrá un pago que hizo este cliente.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="pago-monto" className="text-base">
                Monto
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                  $
                </span>
                <Input
                  id="pago-monto"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
                  className="h-16 pl-10 text-3xl font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pago-fecha" className="text-base">
                Fecha
              </Label>
              <Input
                id="pago-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pago-notas" className="text-base">
                Notas
              </Label>
              <textarea
                id="pago-notas"
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full gap-2 text-lg"
              >
                {loading ? "Guardando..." : "Guardar pago"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
