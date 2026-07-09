"use client";

import { useState } from "react";
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
import { CATEGORIAS_GASTO, CategoriaGastoId } from "@/lib/constants";
import { saveGastoOtro } from "@/app/actions";
import { Receipt } from "lucide-react";

export function GastoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGastoId>("otros");
  const [fecha, setFecha] = useState(hoy);

  function handleMontoChange(value: string) {
    setMonto(value.replace(/[^0-9]/g, ""));
  }

  function resetForm() {
    setDescripcion("");
    setMonto("");
    setCategoria("otros");
    setFecha(hoy);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await saveGastoOtro({
        fecha,
        descripcion,
        monto: parseInt(monto || "0", 10),
        categoria,
      });
      toast.success("✅ Gasto guardado");
      setOpen(false);
      resetForm();
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
        size="lg"
        className="h-14 w-full gap-2 text-base"
        onClick={() => setOpen(true)}
      >
        <Receipt className="size-5" />
        Registrar otro gasto
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Otro gasto</SheetTitle>
            <SheetDescription className="text-base">
              Registrá un gasto que no sea recarga de fábrica.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="gasto-descripcion" className="text-base">
                Descripción
              </Label>
              <Input
                id="gasto-descripcion"
                type="text"
                placeholder="Ej: Nafta, reparación, bidones nuevos…"
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gasto-monto" className="text-base">
                Monto
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                  $
                </span>
                <Input
                  id="gasto-monto"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  required
                  value={monto}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  className="h-16 pl-10 text-3xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Categoría</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIAS_GASTO.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={categoria === cat.id ? "default" : "outline"}
                    onClick={() => setCategoria(cat.id)}
                    className="h-14 text-base"
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gasto-fecha" className="text-base">
                Fecha
              </Label>
              <Input
                id="gasto-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !monto}
                className="h-14 w-full gap-2 text-lg shadow-lg shadow-primary/20"
              >
                {loading ? "Guardando..." : "Guardar gasto"}
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
