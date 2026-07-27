"use client";

import { useEffect } from "react";

export function CulinaryCursorEffect() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handlePointerDown = (event: PointerEvent) => {
      if (
        !finePointer.matches ||
        reducedMotion.matches ||
        event.pointerType !== "mouse" ||
        event.button !== 0
      ) {
        return;
      }

      const effect = document.createElement("span");

      effect.className = "culinary-click-effect";
      effect.style.left = `${event.clientX}px`;
      effect.style.top = `${event.clientY}px`;
      effect.setAttribute("aria-hidden", "true");

      document.body.appendChild(effect);
      effect.addEventListener("animationend", () => effect.remove(), {
        once: true,
      });
      window.setTimeout(() => effect.remove(), 600);
    };

    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
