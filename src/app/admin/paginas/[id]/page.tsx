import { notFound } from "next/navigation";
import { getMenu, getPageById, getSettings, listPageVersions } from "@/lib/data";
import { PageEditor } from "@/components/admin/page-editor";
import { resolveModules } from "@/lib/admin-modules";
import { SECTION_DEFS } from "@/lib/sections";
import { issuePreviewToken } from "@/lib/preview";

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
  let hiddenKeys: string[] = [];
  try {
    [page, menu, versions] = await Promise.all([
      getPageById(numId),
      getMenu(),
      listPageVersions(numId),
    ]);
    const modules = resolveModules((await getSettings()) as Record<string, unknown>);
    hiddenKeys = SECTION_DEFS.filter(
      (s) => s.moduleId && modules[s.moduleId] === false,
    ).map((s) => s.key);
  } catch {
    // BD no disponible
  }

  if (!page) notFound();
  const previewToken = issuePreviewToken(page.slug);

  return <PageEditor page={page} menu={menu} versions={versions} hiddenKeys={hiddenKeys} previewToken={previewToken} />;
}
