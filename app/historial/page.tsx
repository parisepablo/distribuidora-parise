import { HistorialTabs } from "@/components/historial-tabs";

export default function HistorialPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Historial</h2>
        <p className="text-base text-muted-foreground">
          Ganancias, gastos y registros por período.
        </p>
      </div>
      <HistorialTabs />
    </section>
  );
}
