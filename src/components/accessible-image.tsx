import Image from "next/image";

/** Optimiza rutas locales y Vercel Blob; conserva URLs externas arbitrarias. */
export function AccessibleImage({ src, alt, className, sizes, priority = false }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  const optimized = src.startsWith("/") || src.includes(".blob.vercel-storage.com/");
  if (!optimized) {
    // Excepción: Next requiere declarar cada dominio remoto del CMS.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return <Image src={src} alt={alt} className={className} sizes={sizes} priority={priority} width={1200} height={800} />;
}