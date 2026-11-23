"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Native horizontal scrolling, with reachable edges and no page-level overflow. */
export function ScrollableTabsList({ className, children, ...props }: React.ComponentProps<typeof TabsList>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ overflow: false, start: true, end: true });

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      const max = Math.max(0, list.scrollWidth - list.clientWidth);
      const left = Math.max(0, Math.min(max, list.scrollLeft));
      const next = { overflow: max > 1, start: left <= 1, end: max - left <= 1 };
      setEdges(current => current.overflow === next.overflow && current.start === next.start && current.end === next.end ? current : next);
    };
    // Scroll the list only: scrollIntoView would also move the whole page.
    const revealActive = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
        if (active) {
          const bounds = list.getBoundingClientRect();
          const tab = active.getBoundingClientRect();
          const delta = tab.left < bounds.left ? tab.left - bounds.left - 4 : tab.right > bounds.right ? tab.right - bounds.right + 4 : 0;
          if (delta) list.scrollBy({ left: delta, behavior: "instant" });
        }
        update();
      });
    };
    const resize = new ResizeObserver(revealActive);
    resize.observe(list);
    for (const child of list.children) resize.observe(child);
    const mutation = new MutationObserver(records => {
      if (records.some(record => record.type === "childList" || record.attributeName === "aria-selected")) revealActive();
    });
    mutation.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-selected"] });
    list.addEventListener("scroll", update, { passive: true });
    revealActive();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); list.removeEventListener("scroll", update); };
  }, []);

  function move(direction: number) {
    const list = listRef.current;
    if (!list) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: direction * Math.max(120, list.clientWidth * 0.75), behavior: reduced ? "instant" : "smooth" });
  }

  return <div className={cn("flex min-w-0 w-full max-w-full items-center rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur", className)}>
    {edges.overflow && <button type="button" aria-label="Geser menu ke kiri" disabled={edges.start} onClick={() => move(-1)} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-25"><ChevronLeft className="size-4" /></button>}
    <TabsList {...props} ref={listRef} className="flex h-auto min-w-0 w-full flex-1 flex-nowrap justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&>[data-slot=tabs-trigger]]:min-h-11 [&>[data-slot=tabs-trigger]]:max-w-full [&>[data-slot=tabs-trigger]]:whitespace-normal [&>[data-slot=tabs-trigger]]:leading-tight [&>[data-slot=tabs-trigger]]:flex-none [&>[data-slot=tabs-trigger]]:rounded-lg [&>[data-slot=tabs-trigger]]:text-[11px]">
      {children}
    </TabsList>
    {edges.overflow && <button type="button" aria-label="Geser menu ke kanan" disabled={edges.end} onClick={() => move(1)} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-25"><ChevronRight className="size-4" /></button>}
  </div>;
}
