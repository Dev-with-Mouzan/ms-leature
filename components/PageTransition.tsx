"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Lightweight page transition — fades each route in once.
 * Keeps motion subtle and fast (no route-level animation library needed).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-in min-h-[60vh]">
      {children}
    </div>
  );
}
