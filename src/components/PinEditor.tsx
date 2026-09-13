import { Eraser, Pencil, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PIN_COLORS, type PinColor } from "@/lib/pins";

const INK = ["#000000", "#ff0000", "#0000ff", "#008000", "#ff8000"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    kind: "text" | "drawing";
    content: string;
    color: PinColor;
    author: string;
  }) => Promise<void> | void;
};

const paintBtn = (active: boolean) => ({
  background: active
    ? "linear-gradient(180deg, #b0adb0 0%, #c8c5c0 100%)"
    : "linear-gradient(180deg, #e0ddd8 0%, #c8c5c0 100%)",
  border: "2px solid #000000",
  boxShadow: active
    ? "inset -1px -1px 0 #ffffff, inset 2px 2px 0 #808080"
    : "inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080",
  padding: "4px 12px",
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "#000000",
});

export function PinEditor({ open, onOpenChange, onSave }: Props) {
  const [mode, setMode] = useState<"text" | "drawing">("text");
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [color, setColor] = useState<PinColor>("yellow");
  const [ink, setInk] = useState(INK[0]!);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!open) {
      setText("");
      setMode("text");
      setSaving(false);
    }
  }, [open]);

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };

  const start = (e: React.PointerEvent) => {
    const c = ctx();
    if (!c) return;
    // Capture the pointer so strokes aren't interrupted when cursor leaves canvas
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    c.lineWidth = 3;
    c.lineCap = "square"; /* Paint uses square caps */
    c.lineJoin = "miter";
    c.strokeStyle = ink;
    c.beginPath();
    c.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = ctx();
    if (!c) return;
    const p = pos(e);
    c.lineTo(p.x, p.y);
    c.stroke();
  };

  const end = (e: React.PointerEvent) => {
    drawing.current = false;
    (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  };

  const clear = () => {
    const c = ctx();
    const canvas = canvasRef.current;
    if (c && canvas) {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const canSave = mode === "text" ? text.trim().length > 0 : true;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const content =
      mode === "text" ? text.trim().slice(0, 200) : (canvasRef.current?.toDataURL("image/png") ?? "");
    await onSave({ kind: mode, content, color, author: author.trim().slice(0, 40) });
    setSaving(false);
  };

  const NOTE_BG: Record<string, string> = {
    white: "#ffffff",
    yellow: "#ffff00",
    pink: "#ff80c0",
    blue: "#80c0ff",
    green: "#80ff80",
    orange: "#ff8000",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "#c0c0c0",
          border: "3px solid #000000",
          borderRadius: 0,
          boxShadow: "inset 2px 2px 0 #ffffff, inset -2px -2px 0 #808080, 4px 4px 0 #000000",
          padding: 0,
          maxWidth: "420px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: "linear-gradient(90deg, #000080, #1084d0)",
            color: "#ffffff",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          <DialogHeader style={{ margin: 0 }}>
            <DialogTitle style={{ color: "#ffffff", fontSize: "13px", fontWeight: "bold", margin: 0 }}>
              📌 Novo Pin — Pinned.
            </DialogTitle>
            <DialogDescription style={{ display: "none" }}>
              Escreva um recado ou rabisque algo no mural.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button style={paintBtn(mode === "text")} onClick={() => setMode("text")}>
              <Type style={{ width: "12px", height: "12px" }} /> Texto
            </button>
            <button style={paintBtn(mode === "drawing")} onClick={() => setMode("drawing")}>
              <Pencil style={{ width: "12px", height: "12px" }} /> Desenho
            </button>
          </div>

          {/* Note preview area */}
          <div
            style={{
              background: NOTE_BG[color] ?? "#ffff00",
              border: "3px solid #000000",
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.5)",
              padding: "10px",
            }}
          >
            {mode === "text" ? (
              <>
                <textarea
                  value={text}
                  maxLength={200}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escreva aqui..."
                  style={{
                    height: "100px",
                    width: "100%",
                    resize: "none",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "13px",
                    color: "#000000",
                    lineHeight: "1.4",
                  }}
                />
                <div style={{ textAlign: "right", fontSize: "10px", color: "#000000", fontWeight: "bold" }}>
                  {text.length}/200
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={220}
                  onPointerDown={start}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                  style={{
                    width: "100%",
                    touchAction: "none",
                    background: "#ffffff",
                    border: "2px solid #000000",
                    cursor: "crosshair",
                    imageRendering: "pixelated",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {INK.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Cor ${c}`}
                      onClick={() => setInk(c)}
                      style={{
                        width: "22px",
                        height: "22px",
                        background: c,
                        border: ink === c ? "3px solid #000000" : "2px solid #000000",
                        boxShadow: ink === c
                          ? "inset 1px 1px 0 rgba(255,255,255,0.5), 1px 1px 0 #000000"
                          : "1px 1px 0 #000000",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={clear}
                    style={{
                      ...paintBtn(false),
                      marginLeft: "auto",
                      fontSize: "11px",
                    }}
                  >
                    <Eraser style={{ width: "10px", height: "10px" }} /> Limpar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Color picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#000000" }}>Cor do papel:</span>
            {PIN_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-label={c.label}
                onClick={() => setColor(c.value)}
                style={{
                  width: "22px",
                  height: "22px",
                  background: NOTE_BG[c.value] ?? c.token,
                  border: color === c.value ? "3px solid #000000" : "2px solid #000000",
                  boxShadow: color === c.value
                    ? "inset 1px 1px 0 rgba(255,255,255,0.5), 1px 1px 0 #000000"
                    : "1px 1px 0 #000000",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          {/* Author input */}
          <input
            value={author}
            maxLength={40}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Seu nome (opcional)"
            style={{
              width: "100%",
              background: "#ffffff",
              border: "2px solid #000000",
              boxShadow: "inset 1px 1px 0 #808080",
              padding: "4px 8px",
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
              color: "#000000",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* Save button */}
          <button
            onClick={save}
            disabled={!canSave || saving}
            style={{
              width: "100%",
              background: canSave && !saving
                ? "linear-gradient(180deg, #e0ddd8 0%, #c8c5c0 100%)"
                : "#a0a0a0",
              border: "2px solid #000000",
              boxShadow: canSave && !saving
                ? "inset 2px 2px 0 #ffffff, inset -2px -2px 0 #808080, 2px 2px 0 #000000"
                : "none",
              padding: "8px",
              fontFamily: "Arial, sans-serif",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: canSave && !saving ? "pointer" : "not-allowed",
              color: "#000000",
            }}
            onMouseDown={(e) => {
              if (!canSave || saving) return;
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "inset -2px -2px 0 #ffffff, inset 2px 2px 0 #808080, 0px 0px 0 #000000";
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px, 2px)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "inset 2px 2px 0 #ffffff, inset -2px -2px 0 #808080, 2px 2px 0 #000000";
              (e.currentTarget as HTMLButtonElement).style.transform = "";
            }}
          >
            {saving ? "Fixando..." : "📌 Fixar no mural"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
