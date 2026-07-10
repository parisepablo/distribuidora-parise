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
import { saveCliente } from "@/app/actions";
import { DIAS_SEMANA, DiaSemanaId } from "@/lib/constants";
import { UserPlus } from "lucide-react";

export function ClienteNuevoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [dias, setDias] = useState<DiaSemanaId[]>([]);
  const [notas, setNotas] = useState("");

  function resetForm() {
    setNombre("");
    setTelefono("");
    setDireccion("");
    setDias([]);
    setNotas("");
  }

  function toggleDia(dia: DiaSemanaId) {
    setDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await saveCliente({
        nombre,
        telefono,
        direccion,
        notas,
        dias,
      });
      toast.success("✅ Cliente guardado");
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
        size="lg"
        className="h-14 w-full gap-2 text-lg shadow-lg shadow-primary/20"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="size-6" />
        Nuevo cliente
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex h-[92vh] flex-col rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Nuevo cliente</SheetTitle>
            <SheetDescription className="text-base">
              Agregá los datos de contacto.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-1 pt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cliente-nombre" className="text-base">
                Nombre
              </Label>
              <Input
                id="cliente-nombre"
                type="text"
                placeholder="Ej: Juan Pérez"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente-telefono" className="text-base">
                Teléfono
              </Label>
              <Input
                id="cliente-telefono"
                type="tel"
                inputMode="tel"
                placeholder="Ej: 11 1234-5678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente-direccion" className="text-base">
                Dirección
              </Label>
              <Input
                id="cliente-direccion"
                type="text"
                placeholder="Ej: Av. Córdoba 2615, CABA"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Días de visita</Label>
              <div className="grid grid-cols-7 gap-2">
                {DIAS_SEMANA.map((dia) => {
                  const activo = dias.includes(dia.id);
                  return (
                    <button
                      key={dia.id}
                      type="button"
                      onClick={() => toggleDia(dia.id)}
                      className={`flex h-14 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                        activo
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <span>{dia.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Tocá los días en los que se visita este cliente.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente-notas" className="text-base">
                Notas
              </Label>
              <textarea
                id="cliente-notas"
                rows={2}
                placeholder="Ej: timbre roto, atiende por la mañana…"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full gap-2 text-lg shadow-lg shadow-primary/20"
              >
                {loading ? "Guardando..." : "Guardar cliente"}
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
