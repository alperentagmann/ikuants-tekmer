"use client";
import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, EyeOff, GripVertical } from "lucide-react";

const DRAG_TYPE = "application/x-studio-block";

type StudioMessage =
    | { type: "studio-select"; id: string }
    | { type: "studio-move"; id: string; targetId: string; position: "before" | "after" }
    | { type: "studio-action"; id: string; action: "up" | "down" | "hide" };

const send = (msg: StudioMessage) => window.parent.postMessage(msg, window.location.origin);

/**
 * Design studio canvas helpers. When a page is shown inside the studio preview
 * (?onizleme=1&studio=1), every section is outlined on hover; clicking it selects the
 * section in the studio, the grip handle drags it to a new place, and the studio can
 * highlight / scroll to a section.
 */
export function StudioBlock({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
    const [selected, setSelected] = useState(false);
    const [dropPos, setDropPos] = useState<"before" | "after" | null>(null);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== window.location.origin || e.data?.type !== "studio-highlight") return;
            const mine = e.data.id === id;
            setSelected(mine);
            if (mine && e.data.scroll) document.getElementById(`studio-block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [id]);

    const toolButton = "rounded p-1 transition-colors hover:bg-white/20";

    return (
        <div
            id={`studio-block-${id}`}
            data-studio-block={id}
            className={`group/studio relative outline-offset-[-3px] transition-[outline,opacity] ${dragging ? "opacity-40" : ""} ${selected ? "outline outline-[3px] outline-violet-500" : "hover:outline hover:outline-2 hover:outline-violet-400/70"}`}
            onClickCapture={(e) => {
                if ((e.target as HTMLElement).closest("[data-studio-toolbar]")) return;
                // In the canvas, clicks select sections instead of navigating
                e.preventDefault();
                e.stopPropagation();
                send({ type: "studio-select", id });
            }}
            onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                const r = e.currentTarget.getBoundingClientRect();
                const pos = e.clientY < r.top + r.height / 2 ? "before" : "after";
                if (pos !== dropPos) setDropPos(pos);
            }}
            onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropPos(null);
            }}
            onDrop={(e) => {
                const dragged = e.dataTransfer.getData(DRAG_TYPE);
                const pos = dropPos || "after";
                setDropPos(null);
                if (!dragged || dragged === id) return;
                e.preventDefault();
                send({ type: "studio-move", id: dragged, targetId: id, position: pos });
            }}
        >
            {dropPos && <div className={`pointer-events-none absolute inset-x-0 z-[61] h-1.5 rounded-full bg-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.9)] ${dropPos === "before" ? "top-0" : "bottom-0"}`} />}
            <span className={`pointer-events-none absolute left-3 top-3 z-[60] rounded-md bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white shadow-lg ${selected ? "opacity-100" : "opacity-0 group-hover/studio:opacity-100"}`}>{label}</span>
            <div data-studio-toolbar className={`absolute right-3 top-3 z-[60] flex items-center gap-0.5 rounded-lg bg-violet-600 p-1 text-white shadow-lg ${selected ? "opacity-100" : "opacity-0 group-hover/studio:opacity-100"}`}>
                <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData(DRAG_TYPE, id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(true);
                    }}
                    onDragEnd={() => setDragging(false)}
                    className={`${toolButton} cursor-grab active:cursor-grabbing`}
                    title="Tutup sürükleyerek taşıyın"
                    aria-label={`${label} bölümünü sürükleyerek taşı`}
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => send({ type: "studio-action", id, action: "up" })} className={toolButton} title="Yukarı taşı" aria-label="Yukarı taşı"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => send({ type: "studio-action", id, action: "down" })} className={toolButton} title="Aşağı taşı" aria-label="Aşağı taşı"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => send({ type: "studio-action", id, action: "hide" })} className={toolButton} title="Gizle" aria-label="Gizle"><EyeOff className="h-4 w-4" /></button>
            </div>
            {children}
        </div>
    );
}

/** Wraps blocks only inside the studio canvas; elsewhere renders children unchanged. */
export function MaybeStudioBlock({ enabled, id, label, children }: { enabled: boolean; id: string; label: string; children: React.ReactNode }) {
    return enabled ? <StudioBlock id={id} label={label}>{children}</StudioBlock> : <>{children}</>;
}
