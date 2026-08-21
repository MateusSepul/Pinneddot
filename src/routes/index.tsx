import { createFileRoute } from "@tanstack/react-router";
import { Plus, Minus, Pin as PinIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PinEditor } from "@/components/PinEditor";
import { PinNote } from "@/components/PinNote";
import { Button } from "@/components/ui/button";
import { getOwnerKey, getPinsClient, type Pin, type PinColor } from "@/lib/pins";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pinned. — Mural coletivo de post-its" },
      {
        name: "description",
        content:
          "Fixe recados e rabiscos em um mural de cortiça compartilhado. Sem login: escreva, desenhe e veja os post-its de todos em tempo real.",
      },
      { property: "og:title", content: "Pinned. — Mural coletivo de post-its" },
      {
        property: "og:description",
        content: "Escreva, desenhe e fixe post-its em um mural de cortiça compartilhado em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Board,
});

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;

function Board() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [ownerKey, setOwnerKey] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  useEffect(() => {
    setOwnerKey(getOwnerKey());
    const supabase = getPinsClient();

    void supabase
      .from("pins")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Não foi possível carregar o mural.");
          return;
        }
        setPins((data ?? []) as unknown as Pin[]);
      });

    const channel = supabase
      .channel("pins-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "pins" }, (payload) => {
        setPins((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as unknown as Pin;
            return prev.some((p) => p.id === row.id) ? prev : [...prev, row];
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as unknown as Pin;
            return prev.map((p) => (p.id === row.id ? row : p));
          }
          const old = payload.old as { id?: string };
          return prev.filter((p) => p.id !== old.id);
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    const { zoom: z, offset: o } = stateRef.current;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
    const k = next / z;
    setZoom(next);
    setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
        zoomAt(Math.exp(-dy * 0.0025), e.clientX - rect.left, e.clientY - rect.top);
        return;
      }
      e.preventDefault();
      setOffset((o) => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const pan = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null);

  const savePin = async (data: {
    kind: "text" | "drawing";
    content: string;
    color: PinColor;
    author: string;
  }) => {
    const supabase = getPinsClient();
    const el = containerRef.current;
    const w = el?.clientWidth ?? 800;
    const h = el?.clientHeight ?? 600;
    const { error } = await supabase.from("pins").insert({
      kind: data.kind,
      content: data.content,
      color: data.color,
      author: data.author || null,
      owner_key: getOwnerKey(),
      rotation: Math.random() * 16 - 8,
      x: (-offset.x + Math.random() * (w - 260) + 30) / zoom,
      y: (-offset.y + Math.random() * (h - 300) + 100) / zoom,
    });
    if (error) {
      toast.error("Não foi possível fixar o pin.");
      return;
    }
    setEditorOpen(false);
    toast.success("Pin fixado no mural!");
  };

  const deletePin = async (id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
    const { error } = await getPinsClient().from("pins").delete().eq("id", id);
    if (error) toast.error("Não foi possível excluir.");
  };

  const movePin = async (id: string, x: number, y: number) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
    await getPinsClient().from("pins").update({ x, y }).eq("id", id);
  };

  return (
    <main className="relative h-screen overflow-hidden">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-card/85 px-4 py-2 shadow-lg backdrop-blur">
          <PinIcon className="size-5 -rotate-45 text-primary" />
          <h1 className="font-hand text-3xl leading-none text-foreground">Pinned.</h1>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="rounded-full bg-card/85 px-3 py-2 font-hand text-lg shadow-lg backdrop-blur">
            {pins.length} {pins.length === 1 ? "pin" : "pins"}
          </span>
          <div className="hidden items-center gap-1 rounded-full bg-card/85 p-1 shadow-lg backdrop-blur sm:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Diminuir zoom"
              onClick={() => {
                const el = containerRef.current;
                zoomAt(1 / 1.2, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2);
              }}
            >
              <Minus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aumentar zoom"
              onClick={() => {
                const el = containerRef.current;
                zoomAt(1.2, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2);
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div
        ref={containerRef}
        className="corkboard h-full w-full touch-none"
        onPointerDown={(e) => {
          pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(e) => {
          const p = pan.current;
          if (!p || p.id !== e.pointerId) return;
          setOffset({ x: p.ox + (e.clientX - p.x), y: p.oy + (e.clientY - p.y) });
        }}
        onPointerUp={() => {
          pan.current = null;
        }}
        onPointerCancel={() => {
          pan.current = null;
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {pins.map((pin) => (
            <PinNote
              key={pin.id}
              pin={pin}
              isMine={pin.owner_key === ownerKey}
              scale={zoom}
              onDelete={deletePin}
              onMove={movePin}
            />
          ))}
        </div>
      </div>

      {pins.length === 0 && (
        <p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8 text-center font-hand text-3xl text-card/90 drop-shadow">
          O mural está vazio. Fixe o primeiro recado!
        </p>
      )}

      <Button
        size="lg"
        onClick={() => setEditorOpen(true)}
        className="fixed bottom-6 right-6 z-30 rounded-full px-6 py-6 font-hand text-2xl shadow-xl transition hover:-translate-y-0.5"
      >
        <Plus className="mr-1 size-5" /> Novo Pin
      </Button>

      <PinEditor open={editorOpen} onOpenChange={setEditorOpen} onSave={savePin} />
    </main>
  );
}
