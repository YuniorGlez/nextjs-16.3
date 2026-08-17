import { notFound } from "next/navigation";
import { getMenu, getPageById, listPageVersions } from "@/lib/data";
import { PageEditor } from "@/components/admin/page-editor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);

  let page: Awaited<ReturnType<typeof getPageById>> = null;
  let menu: Awaited<ReturnType<typeof getMenu>> = [];
  let versions: Awaited<ReturnType<typeof listPageVersions>> = [];
  try {
    [page, menu, versions] = await Promise.all([
      getPageById(numId),
      getMenu(),
      listPageVersions(numId),
    ]);
  } catch {
    // BD no disponible
  }

  if (!page) notFound();

  return <PageEditor page={page} menu={menu} versions={versions} />;
}
