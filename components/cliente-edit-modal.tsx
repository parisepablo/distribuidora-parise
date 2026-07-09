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
import { MapPicker } from "@/components/map-picker";
import { updateCliente } from "@/app/actions";
import { Pencil, MapPin, X } from "lucide-react";

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
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState(cliente.nombre);
  const [telefono, setTelefono] = useState(cliente.telefono ?? "");
  const [direccion, setDireccion] = useState(cliente.direccion ?? "");
  const [lat, setLat] = useState<number | undefined>(cliente.lat ?? undefined);
  const [lng, setLng] = useState<number | undefined>(cliente.lng ?? undefined);
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
        lat,
        lng,
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

  function handleUbicacionSeleccionada(data: {
    direccion: string;
    lat: number;
    lng: number;
  }) {
    setDireccion(data.direccion);
    setLat(data.lat);
    setLng(data.lng);
    setMostrarMapa(false);
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
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">Editar cliente</SheetTitle>
            <SheetDescription className="text-base">
              Modificá los datos y la ubicación en el mapa.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-1 pt-4"
          >
            {!mostrarMapa ? (
              <>
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
                  <Label className="text-base">Dirección</Label>
                  {direccion ? (
                    <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-4">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-base leading-snug">{direccion}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarMapa(true)}
                        className="shrink-0 text-sm text-primary underline underline-offset-2"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMostrarMapa(true)}
                      className="h-14 w-full justify-start gap-2 text-base"
                    >
                      <MapPin className="size-5" />
                      Elegir dirección en el mapa
                    </Button>
                  )}
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
              </>
            ) : (
              <div className="flex h-full flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Elegir ubicación</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMostrarMapa(false)}
                    className="h-10 w-10"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                <div className="flex-1">
                  <MapPicker
                    initialDireccion={direccion}
                    initialLat={lat}
                    initialLng={lng}
                    onConfirm={handleUbicacionSeleccionada}
                    onCancel={() => setMostrarMapa(false)}
                  />
                </div>
              </div>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
