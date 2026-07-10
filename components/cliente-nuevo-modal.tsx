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
import { saveCliente } from "@/app/actions";
import { UserPlus, MapPin, ArrowLeft } from "lucide-react";

export function ClienteNuevoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [notas, setNotas] = useState("");

  function resetForm() {
    setNombre("");
    setTelefono("");
    setDireccion("");
    setLat(undefined);
    setLng(undefined);
    setNotas("");
    setMostrarMapa(false);
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
        lat,
        lng,
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
        size="lg"
        className="h-14 w-full gap-2 text-lg shadow-lg shadow-primary/20"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="size-6" />
        Nuevo cliente
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex h-[92vh] flex-col rounded-t-3xl">
          {!mostrarMapa ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl">Nuevo cliente</SheetTitle>
                <SheetDescription className="text-base">
                  Agregá los datos de contacto y elegí la ubicación correcta en
                  el mapa.
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
                  <Label className="text-base">Dirección</Label>
                  {direccion ? (
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-5">
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
                  <p className="text-sm text-muted-foreground">
                    Buscá la dirección y elegí el resultado correcto para evitar
                    confusiones.
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
            </>
          ) : (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="mb-4 flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMostrarMapa(false)}
                  className="h-10 w-10 shrink-0"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <h3 className="text-lg font-semibold">Elegir ubicación</h3>
              </div>
              <div className="min-h-0 flex-1">
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
        </SheetContent>
      </Sheet>
    </>
  );
}
