"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Wrapper que anima la página con GSAP:
 * - Entrada del hero (elementos con [data-hero]) al cargar.
 * - Revelado de secciones/elementos con [data-reveal] al hacer scroll.
 * - Aparición escalonada de tarjetas ([data-stagger]).
 * - Parallax sutil del fondo del hero ([data-hero-bg]).
 *
 * Uso en la página pública (server component):
 *   <SiteAnimations>
 *     <div>...tu landing...</div>
 *   </SiteAnimations>
 * y marca los elementos con data-hero / data-reveal / data-stagger / data-hero-bg.
 */
export function SiteAnimations({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // respetar preferencias de "menos movimiento"
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const ctx = gsap.context(() => {
      // 1) Entrada del hero
      if (gsap.utils.toArray("[data-hero]").length) {
        gsap.fromTo(
          "[data-hero]",
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            delay: 0.15,
            clearProps: "all",
          },
        );
      }

      // 2) Parallax sutil del fondo del hero
      if (gsap.utils.toArray("[data-hero-bg]").length) {
        gsap.to("[data-hero-bg]", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero-bg]",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // 3) Revelado de secciones al entrar en pantalla
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const delay = parseFloat(el.dataset.setRevealDelay || "0");
        gsap.fromTo(
          el,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            delay,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          },
        );
      });

      // 4) Aparición escalonada de tarjetas (destacados, galería…)
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        const items = Array.from(group.children) as HTMLElement[];
        gsap.fromTo(
          items,
          { opacity: 0, y: 30, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: {
              trigger: group,
              start: "top 85%",
              once: true,
            },
          },
        );
      });

      // refresh tras el layout de imágenes
      ScrollTrigger.refresh();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
