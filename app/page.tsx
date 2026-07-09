import { InicioForm } from "@/components/inicio-form";
import { getActivePrecios, getTodayRegistro } from "@/app/actions";

export default async function InicioPage() {
  const [precios, registro] = await Promise.all([
    getActivePrecios(),
    getTodayRegistro(),
  ]);

  return <InicioForm precios={precios} registro={registro} />;
}
