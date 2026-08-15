import { getMenu } from "@/lib/data";
import { CartaEditor } from "@/components/admin/carta-editor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CartaPage() {
  let menu: Awaited<ReturnType<typeof getMenu>> = [];
  try {
    menu = await getMenu();
  } catch {
    // BD no disponible
  }
  return <CartaEditor categories={menu} />;
}