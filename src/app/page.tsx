import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <JsonLd />
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-32 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {siteConfig.tagline}
        </p>
      </main>
    </div>
  );
}
