"use client";

import { useEffect, useMemo, useState } from "react";
import { getResidueClassName } from "@/lib/coloring";
import type { AlignResponse, ColorMode, ViewerState } from "@/lib/types";
import { HoverTooltip } from "./HoverTooltip";

type AlignmentViewerProps = {
  alignment: AlignResponse;
  colorMode: ColorMode;
  blockSize: number;
  showConsensus: boolean;
  showRuler: boolean;
};

type AlignmentBlockProps = AlignmentViewerProps & {
  start: number;
  end: number;
  blockNumber: number;
  blockCount: number;
  hovered: ViewerState["hovered"];
  onHover: (hovered: ViewerState["hovered"]) => void;
  onLeave: () => void;
};

export function AlignmentViewer({ alignment, colorMode, blockSize, showConsensus, showRuler }: AlignmentViewerProps) {
  const [hovered, setHovered] = useState<ViewerState["hovered"]>();

  const blocks = useMemo(() => {
    const blockCount = Math.max(1, Math.ceil(alignment.alignmentLength / blockSize));
    return Array.from({ length: blockCount }, (_, index) => {
      const start = index * blockSize;
      return {
        start,
        end: Math.min(start + blockSize, alignment.alignmentLength)
      };
    });
  }, [alignment.alignmentLength, blockSize]);

  useEffect(() => {
    setHovered(undefined);
  }, [alignment.jobId, blockSize]);

  return (
      <div className="mt-4 space-y-4">
        {alignment.warnings.length ? (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {alignment.warnings.join(" ")}
          </div>
        ) : null}

      <div className="space-y-5">
        {blocks.map((block, index) => (
          <AlignmentBlock
            key={`${block.start}-${block.end}`}
            alignment={alignment}
            colorMode={colorMode}
            blockSize={blockSize}
            showConsensus={showConsensus}
            showRuler={showRuler}
            start={block.start}
            end={block.end}
            blockNumber={index + 1}
            blockCount={blocks.length}
            hovered={hovered}
            onHover={setHovered}
            onLeave={() => setHovered(undefined)}
          />
        ))}
      </div>
    </div>
  );
}

function AlignmentBlock({
  alignment,
  colorMode,
  showConsensus,
  showRuler,
  start,
  end,
  blockNumber,
  blockCount,
  hovered,
  onHover,
  onLeave
}: AlignmentBlockProps) {
  const blockHovered =
    hovered && hovered.alignmentColumn >= start + 1 && hovered.alignmentColumn <= end ? hovered : undefined;
  const hoveredColumn = blockHovered ? alignment.columns[blockHovered.alignmentColumn - 1] : undefined;
  const ruler = buildRuler(start, end);
  const consensus = alignment.columns
    .slice(start, end)
    .map((column) => column.consensusChar ?? " ")
    .join("");

  return (
    <section className="space-y-2" onMouseLeave={onLeave}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-700">
        <div className="font-medium text-stone-900">
          Block {blockNumber} of {blockCount}
        </div>
        <div>
          Columns {start + 1}-{end} of {alignment.alignmentLength}
        </div>
      </div>

      <div className="alignment-surface">
        {showRuler ? (
          <div className="alignment-row alignment-ruler-row">
            <div className="alignment-label" aria-hidden="true" />
            <div className="alignment-ruler" aria-label={`Alignment columns ${start + 1} through ${end}`}>
              {ruler.map((char, index) => (
                <span key={`ruler-${start + index}`} className="ruler-cell">
                  {char}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {showConsensus ? (
          <div className="alignment-row">
            <div className="alignment-label">Consensus</div>
            <div className="alignment-chars" aria-label="Consensus sequence">
              {[...consensus].map((char, index) => (
                <span key={`${start + index}-consensus`} className="residue residue-consensus consensus-cell">
                  {char}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {alignment.sequences.map((sequence) => (
          <div key={`${blockNumber}-${sequence.id}`} className="alignment-row">
            <div className="alignment-label" title={sequence.description ? `${sequence.id} ${sequence.description}` : sequence.id}>
              {sequence.id}
            </div>
            <div className="alignment-chars" aria-label={`${sequence.id} aligned sequence`}>
              {[...sequence.alignedSequence.slice(start, end)].map((char, index) => {
                const alignmentColumn = start + index + 1;
                const column = alignment.columns[alignmentColumn - 1];
                const originalCoordinate = sequence.alignmentToOriginal[alignmentColumn - 1];
                const isHovered = hovered?.sequenceId === sequence.id && hovered.alignmentColumn === alignmentColumn;

                return (
                  <span
                    key={`${sequence.id}-${alignmentColumn}`}
                    className={`${getResidueClassName(char, colorMode, alignment.sequenceType, column)} ${
                      isHovered ? "residue-hovered" : ""
                    }`}
                    title={`${sequence.id} column ${alignmentColumn}`}
                    onMouseEnter={() =>
                      onHover({
                        sequenceId: sequence.id,
                        alignmentColumn,
                        originalCoordinate,
                        originalLength: sequence.originalLength,
                        char,
                        isGap: originalCoordinate === null
                      })
                    }
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {blockHovered ? <HoverTooltip hovered={blockHovered} column={hoveredColumn} /> : null}
    </section>
  );
}

export function buildRuler(start: number, end: number): string[] {
  const length = Math.max(0, end - start);
  const chars = Array.from({ length }, () => " ");

  for (let column = start + 1; column <= end; column += 1) {
    if (column !== 1 && column % 10 !== 0) {
      continue;
    }

    const label = String(column);
    const zeroBasedColumn = column - start - 1;
    const labelStart = Math.max(0, zeroBasedColumn - label.length + 1);

    for (let offset = 0; offset < label.length && labelStart + offset < chars.length; offset += 1) {
      chars[labelStart + offset] = label[offset];
    }
  }

  return chars;
}
