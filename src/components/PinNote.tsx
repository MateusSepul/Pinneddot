import { Trash2 } from "lucide-react";
import { useRef } from "react";

import { formatDate, type Pin } from "@/lib/pins";

type Props = {
  pin: Pin;
  isMine: boolean;
  scale: number;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

export function PinNote({ pin, isMine, scale, onDelete, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; ox: number; oy: number } | null>(
    null,
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isMine) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.stopPropagation();
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, ox: pin.x, oy: pin.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !ref.current) return;
    const nx = d.ox + (e.clientX - d.startX) / scale;
    const ny = d.oy + (e.clientY - d.startY) / scale;
    ref.current.style.left = `${nx}px`;
    ref.current.style.top = `${ny}px`;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const nx = d.ox + (e.clientX - d.startX) / scale;
    const ny = d.oy + (e.clientY - d.startY) / scale;
    if (Math.abs(nx - d.ox) > 2 || Math.abs(ny - d.oy) > 2) onMove(pin.id, nx, ny);
  };

  return (
    <div
      ref={ref}
      className="note absolute w-[200px] select-none"
      style={{
        left: pin.x,
        top: pin.y,
        transform: `rotate(${pin.rotation}deg)`,
        background: `var(--note-${pin.color})`,
        cursor: isMine ? "grab" : "default",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="pin-head" aria-hidden />
      {isMine && (
        <button
          data-no-drag
          aria-label="Excluir post-it"
          onClick={() => onDelete(pin.id)}
          className="absolute right-1.5 top-1.5 rounded-full bg-foreground/10 p-1 text-foreground/60 opacity-0 transition hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 group-hover:opacity-100 [.note:hover_&]:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}

      <div className="px-4 pb-3 pt-7">
        {pin.kind === "text" ? (
          <p className="font-hand text-[1.35rem] leading-tight break-words text-foreground/85">
            {pin.content}
          </p>
        ) : (
          <img
            src={pin.content}
            alt="Desenho fixado no mural"
            className="w-full rounded-sm"
            draggable={false}
          />
        )}
        <div className="mt-3 flex items-center justify-between font-hand text-sm text-foreground/50">
          <span>{pin.author?.trim() ? pin.author : "Anônimo"}</span>
          <span>{formatDate(pin.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
