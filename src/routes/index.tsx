import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PinEditor } from "@/components/PinEditor";
import { PinNote } from "@/components/PinNote";
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
      rotation: Math.random() * 10 - 5,
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
    <main className="relative h-screen overflow-hidden" style={{ background: "#c0c0c0" }}>
      {/* MS Paint-style toolbar at top */}
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-3 sm:px-6"
        style={{
          background: "linear-gradient(180deg, #d4d0c8 0%, #c0c0c0 100%)",
          borderBottom: "3px solid #000000",
          boxShadow: "0 3px 0 #808080",
          height: "84px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="Pinned."
            style={{
              height: "72px",
              width: "auto",
              display: "block",
              imageRendering: "pixelated",
              filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.3))",
            }}
          />
        </div>

        {/* Right side controls — paint-style raised buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Pin counter */}
          <div
            style={{
              background: "#ffffff",
              border: "2px solid #000000",
              boxShadow: "inset 1px 1px 0 #808080, 1px 1px 0 #ffffff",
              padding: "4px 12px",
              fontFamily: "Arial, sans-serif",
              fontWeight: "bold",
              fontSize: "14px",
              color: "#000000",
              minWidth: "85px",
              textAlign: "center",
            }}
          >
            📌 {pins.length} {pins.length === 1 ? "pin" : "pins"}
          </div>

          {/* Zoom buttons — paint toolbar style */}
          <div style={{ display: "flex", gap: "3px" }}>
            <button
              aria-label="Diminuir zoom"
              onClick={() => {
                const el = containerRef.current;
                zoomAt(1 / 1.2, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2);
              }}
              style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(180deg, #e0ddd8 0%, #c8c5c0 100%)",
                border: "2px solid #000000",
                boxShadow: "inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080, 1px 1px 0 #000000",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Arial",
              }}
            >
              −
            </button>
            <button
              aria-label="Aumentar zoom"
              onClick={() => {
                const el = containerRef.current;
                zoomAt(1.2, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2);
              }}
              style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(180deg, #e0ddd8 0%, #c8c5c0 100%)",
                border: "2px solid #000000",
                boxShadow: "inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080, 1px 1px 0 #000000",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Arial",
              }}
            >
              +
            </button>
          </div>
        </div>
      </header>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="corkboard h-full w-full touch-none"
        style={{ paddingTop: "84px" }}
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
        <p
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8 text-center"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#000000",
            paddingTop: "56px",
          }}
        >
          O mural está vazio. Clique em "Novo Pin" para começar!
        </p>
      )}

      {/* "Novo Pin" button — big Paint-style */}
      <button
        id="btn-novo-pin"
        onClick={() => setEditorOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 30,
          background: "linear-gradient(180deg, #e8e5e0 0%, #c8c5c0 100%)",
          color: "#000000",
          border: "3px solid #000000",
          boxShadow: "inset 2px 2px 0 #ffffff, inset -2px -2px 0 #808080, 3px 3px 0 #000000",
          padding: "10px 20px",
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          letterSpacing: "0.5px",
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "inset -2px -2px 0 #ffffff, inset 2px 2px 0 #808080, 1px 1px 0 #000000";
          (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px, 2px)";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "inset 2px 2px 0 #ffffff, inset -2px -2px 0 #808080, 3px 3px 0 #000000";
          (e.currentTarget as HTMLButtonElement).style.transform = "";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "inset 2px 2px 0 #ffffff, inset -2px -2px 0 #808080, 3px 3px 0 #000000";
          (e.currentTarget as HTMLButtonElement).style.transform = "";
        }}
      >
        📌 Novo Pin
      </button>

      <PinEditor open={editorOpen} onOpenChange={setEditorOpen} onSave={savePin} />
    </main>
  );
}
