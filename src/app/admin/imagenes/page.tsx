import { getSettings } from "@/lib/data";
import { AiSettingsEditor } from "@/components/admin/ai-settings-editor";
import { blobConfigured } from "@/lib/blob";
import { MediaLibrary } from "@/components/admin/media-library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ImagenesPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  const ai = (settings.ai ?? {}) as Record<string, unknown>;
  const dbKeySet = typeof ai.openrouterApiKey === "string" && ai.openrouterApiKey.trim().length > 0;
  const envKeySet = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  return (
    <>
      <AiSettingsEditor dbKeySet={dbKeySet} envKeySet={envKeySet} blobOk={blobConfigured()} />
      <MediaLibrary />
    </>
  );
}
