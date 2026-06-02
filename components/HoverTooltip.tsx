"use client";

import type { AlignmentColumnSummary, ViewerState } from "@/lib/types";

type HoverTooltipProps = {
  hovered: ViewerState["hovered"];
  column?: AlignmentColumnSummary;
};

export function HoverTooltip({ hovered, column }: HoverTooltipProps) {
  if (!hovered) {
    return null;
  }

  const sequenceCoordinate = hovered.isGap ? "gap" : `${hovered.originalCoordinate} / ${hovered.originalLength}`;
  const residueCounts = column ? Object.entries(column.residues).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) : [];

  return (
    <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-stone-900">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <InfoCell label="Sequence" value={hovered.sequenceId} />
        <InfoCell label="Alignment column" value={String(hovered.alignmentColumn)} />
        <InfoCell label="Sequence coordinate" value={sequenceCoordinate} />
        <InfoCell label={hovered.isGap ? "Gap" : "Residue"} value={hovered.char} />
        {column ? (
          <>
            <InfoCell label="Consensus" value={column.consensusChar ?? "-"} compact />
            <InfoCell label="Conserved" value={column.isConserved ? "yes" : "no"} compact />
            <InfoCell label="Non-gap" value={String(column.nonGapCount)} compact />
            <InfoCell label="Gaps" value={String(column.gapCount)} compact />
          </>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {residueCounts.length ? (
          residueCounts.map(([residue, count]) => (
            <span key={residue} className="rounded border border-emerald-200 bg-white px-2 py-1 text-xs text-stone-800">
              {residue}: {count}
            </span>
          ))
        ) : (
          <span className="text-xs text-stone-600">No non-gap residues in this column.</span>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="min-w-[88px]">
      <div className={`${compact ? "text-[11px]" : "text-xs"} font-medium uppercase tracking-normal text-stone-600`}>{label}</div>
      <div className={`${compact ? "mt-0.5 text-sm" : "mt-1 text-base"} font-semibold text-stone-950`}>{value}</div>
    </div>
  );
}
