"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import type { ColorMode } from "@/lib/types";

type ViewerControlsProps = {
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  blockSize: number;
  onBlockSizeChange: (size: number) => void;
  showConsensus: boolean;
  onShowConsensusChange: (show: boolean) => void;
  showRuler: boolean;
  onShowRulerChange: (show: boolean) => void;
  variant?: "card" | "inline";
};

export function ViewerControls({
  colorMode,
  onColorModeChange,
  blockSize,
  onBlockSizeChange,
  showConsensus,
  onShowConsensusChange,
  showRuler,
  onShowRulerChange,
  variant = "card"
}: ViewerControlsProps) {
  const [blockSizeInput, setBlockSizeInput] = useState(String(blockSize));

  useEffect(() => {
    setBlockSizeInput(String(blockSize));
  }, [blockSize]);

  function commitBlockSize() {
    const parsed = Number.parseInt(blockSizeInput, 10);
    const nextValue = Number.isFinite(parsed) ? clamp(parsed, 20, 500) : blockSize;
    setBlockSizeInput(String(nextValue));
    onBlockSizeChange(nextValue);
  }

  function handleBlockSizeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  const content = (
    <div
      className={
        variant === "inline"
          ? "flex flex-wrap items-end gap-3"
          : "grid gap-3 md:grid-cols-[minmax(160px,220px)_140px_1fr]"
      }
    >
        <label className={variant === "inline" ? "block min-w-[180px] text-sm font-medium text-stone-800" : "block text-sm font-medium text-stone-800"}>
          Coloring
          <select
            value={colorMode}
            onChange={(event) => onColorModeChange(event.target.value as ColorMode)}
            className="mt-2 w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="none">None</option>
            <option value="nucleotide">Nucleotide</option>
            <option value="amino-acid">Amino acid</option>
            <option value="conservation">Conservation</option>
            <option value="gaps">Gaps</option>
            <option value="difference">Difference</option>
          </select>
        </label>

        <label className={variant === "inline" ? "block w-[132px] text-sm font-medium text-stone-800" : "block text-sm font-medium text-stone-800"}>
          Block size
          <input
            type="number"
            min={20}
            max={500}
            value={blockSizeInput}
            onChange={(event) => setBlockSizeInput(event.target.value)}
            onBlur={commitBlockSize}
            onKeyDown={handleBlockSizeKeyDown}
            className="mt-2 w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <div className="flex flex-wrap items-end gap-4 pb-2 text-sm text-stone-800">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showConsensus} onChange={(event) => onShowConsensusChange(event.target.checked)} />
            <span>Consensus</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showRuler} onChange={(event) => onShowRulerChange(event.target.checked)} />
            <span>Ruler</span>
          </label>
        </div>
      </div>
  );

  if (variant === "inline") {
    return content;
  }

  return <div className="rounded border border-stone-300 bg-white p-4">{content}</div>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
