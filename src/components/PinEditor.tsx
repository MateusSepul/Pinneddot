import { Eraser, Pencil, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PIN_COLORS, type PinColor } from "@/lib/pins";
import { cn } from "@/lib/utils";

const INK = ["#2b2118", "#e04848", "#2f7fe0", "#2fa35b", "#f0a52a"];

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
    drawing.current = true;
    const p = pos(e);
    c.lineWidth = 4;
    c.lineCap = "round";
    c.lineJoin = "round";
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

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = ctx();
    const canvas = canvasRef.current;
    if (c && canvas) c.clearRect(0, 0, canvas.width, canvas.height);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-hand text-3xl">Novo pin</DialogTitle>
          <DialogDescription>Escreva um recado ou rabisque algo no mural.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("text")}
          >
            <Type className="mr-1 size-4" /> Texto
          </Button>
          <Button
            type="button"
            variant={mode === "drawing" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("drawing")}
          >
            <Pencil className="mr-1 size-4" /> Desenho
          </Button>
        </div>

        <div
          className="rounded-xl p-4 shadow-inner"
          style={{ background: `var(--note-${color})` }}
        >
          {mode === "text" ? (
            <>
              <textarea
                value={text}
                maxLength={200}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva aqui..."
                className="h-32 w-full resize-none bg-transparent font-hand text-2xl leading-tight text-foreground/85 outline-none placeholder:text-foreground/35"
              />
              <div className="text-right font-hand text-sm text-foreground/50">
                {text.length}/200
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <canvas
                ref={canvasRef}
                width={360}
                height={260}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerLeave={end}
                className="w-full touch-none rounded-md bg-background/40"
              />
              <div className="flex items-center gap-2">
                {INK.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Cor ${c}`}
                    onClick={() => setInk(c)}
                    className={cn(
                      "size-6 rounded-full border-2 transition",
                      ink === c ? "border-foreground/70 scale-110" : "border-foreground/20",
                    )}
                    style={{ background: c }}
                  />
                ))}
                <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={clear}>
                  <Eraser className="mr-1 size-4" /> Limpar
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Cor do papel:</span>
          {PIN_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.label}
              onClick={() => setColor(c.value)}
              className={cn(
                "size-7 rounded-md border-2 shadow-sm transition",
                color === c.value ? "border-foreground/70 scale-110" : "border-foreground/15",
              )}
              style={{ background: c.token }}
            />
          ))}
        </div>

        <Input
          value={author}
          maxLength={40}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Seu nome (opcional)"
        />

        <Button onClick={save} disabled={!canSave || saving} size="lg" className="w-full">
          {saving ? "Fixando..." : "Fixar no mural"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
