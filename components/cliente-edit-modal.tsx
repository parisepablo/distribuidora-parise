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
import { updateCliente } from "@/app/actions";
import { Pencil } from "lucide-react";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  notas: string | null;
};

export function ClienteEditModal({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState(cliente.nombre);
  const [telefono, setTelefono] = useState(cliente.telefono ?? "");
  const [direccion, setDireccion] = useState(cliente.direccion ?? "");
  const [notas, setNotas] = useState(cliente.notas ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await updateCliente({
        id: cliente.id,
        nombre,
        telefono,
        direccion,
        notas,
      });
      toast.success("✅ Cliente actualizado");
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
        size="lg"
        className="h-12 w-full gap-2 text-base"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-5" />
        Editar cliente
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex h-[92vh] flex-col rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Editar cliente</SheetTitle>
            <SheetDescription className="text-base">
              Modificá los datos de contacto.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-1 pt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="editar-nombre" className="text-base">
                Nombre
              </Label>
              <Input
                id="editar-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editar-telefono" className="text-base">
                Teléfono
              </Label>
              <Input
                id="editar-telefono"
                type="tel"
                inputMode="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editar-direccion" className="text-base">
                Dirección
              </Label>
              <Input
                id="editar-direccion"
                type="text"
                placeholder="Ej: Av. Córdoba 2615, CABA"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="h-14 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editar-notas" className="text-base">
                Notas
              </Label>
              <textarea
                id="editar-notas"
                rows={2}
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
                {loading ? "Guardando..." : "Guardar cambios"}
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
