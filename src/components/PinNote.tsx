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

const NOTE_BG: Record<string, string> = {
  white: "#ffffff",
  yellow: "#ffff00",
  pink: "#ff80c0",
  blue: "#80c0ff",
  green: "#80ff80",
  orange: "#ff8000",
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

  const bg = NOTE_BG[pin.color] ?? "#ffff00";

  return (
    <div
      ref={ref}
      className="note absolute w-[200px] select-none"
      style={{
        left: pin.x,
        top: pin.y,
        transform: `rotate(${pin.rotation}deg)`,
        background: bg,
        cursor: isMine ? "grab" : "default",
        marginTop: "28px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Pixel thumbtack */}
      <span className="pin-head" aria-hidden />

      {isMine && (
        <button
          data-no-drag
          aria-label="Excluir post-it"
          onClick={() => onDelete(pin.id)}
          style={{
            position: "absolute",
            right: "2px",
            top: "2px",
            zIndex: 2,
            width: "20px",
            height: "20px",
            background: "#ff0000",
            border: "2px solid #000000",
            boxShadow: "inset 1px 1px 0 #ff8080, 1px 1px 0 #000000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
          }}
          className="[.note:hover_&]:opacity-100 focus-visible:opacity-100 transition-opacity"
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "inset -1px -1px 0 #ff8080, inset 1px 1px 0 #800000";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "inset 1px 1px 0 #ff8080, 1px 1px 0 #000000";
          }}
        >
          <Trash2 style={{ width: "10px", height: "10px", color: "#ffffff" }} />
        </button>
      )}

      <div style={{ padding: "8px 10px 8px 10px", paddingTop: "28px" }}>
        {pin.kind === "text" ? (
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "13px",
              lineHeight: "1.4",
              color: "#000000",
              wordBreak: "break-words",
              zIndex: 2,
              position: "relative",
              margin: 0,
            }}
          >
            {pin.content}
          </p>
        ) : (
          <img
            src={pin.content}
            alt="Desenho fixado no mural"
            style={{
              width: "100%",
              imageRendering: "pixelated",
              position: "relative",
              zIndex: 2,
              border: "1px solid #000000",
            }}
            draggable={false}
          />
        )}
        <div
          style={{
            marginTop: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Arial, sans-serif",
            fontSize: "10px",
            color: "#000000",
            borderTop: "1px solid rgba(0,0,0,0.3)",
            paddingTop: "4px",
            zIndex: 2,
            position: "relative",
            fontWeight: "bold",
          }}
        >
          <span>{pin.author?.trim() ? pin.author : "Anônimo"}</span>
          <span>{formatDate(pin.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
