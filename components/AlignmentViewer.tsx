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
  selection: ResidueSelection | undefined;
  copyStatus: string | undefined;
  onHover: (hovered: ViewerState["hovered"]) => void;
  onResidueClick: (point: ResiduePoint) => void;
  onCopySelection: (details: SelectionDetails) => void;
  onLeave: () => void;
};

type ResiduePoint = NonNullable<ViewerState["hovered"]>;

type ResidueSelection = {
  anchor: ResiduePoint;
  focus?: ResiduePoint;
};

type SelectionDetails = {
  sequenceId: string;
  startColumn: number;
  endColumn: number;
  originalStart?: number;
  originalEnd?: number;
  alignedSequence: string;
  sequence: string;
};

export function AlignmentViewer({ alignment, colorMode, blockSize, showConsensus, showRuler }: AlignmentViewerProps) {
  const [hovered, setHovered] = useState<ViewerState["hovered"]>();
  const [selection, setSelection] = useState<ResidueSelection>();
  const [copyStatus, setCopyStatus] = useState<string>();

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
  const selectionDetails = useMemo(() => getSelectionDetails(selection, alignment), [alignment, selection]);

  useEffect(() => {
    setHovered(undefined);
    setSelection(undefined);
    setCopyStatus(undefined);
  }, [alignment.jobId]);

  useEffect(() => {
    setHovered(undefined);
  }, [alignment.jobId, blockSize]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("[data-residue-cell='true']") || target.closest("[data-selection-ui='true']")) {
        return;
      }

      setSelection(undefined);
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "c") {
        return;
      }

      if (!selection?.focus || !selectionDetails || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      copySelectedSequence(selectionDetails);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selection, selectionDetails]);

  function handleResidueClick(point: ResiduePoint) {
    setSelection((current) => {
      setCopyStatus(undefined);
      if (current && !current.focus && current.anchor.sequenceId === point.sequenceId) {
        return {
          anchor: current.anchor,
          focus: point
        };
      }

      return {
        anchor: point
      };
    });
  }

  async function copySelectedSequence(details: SelectionDetails) {
    try {
      await copyText(details.sequence);
      setCopyStatus(`Copied ${details.sequence.length} residues`);
    } catch {
      setCopyStatus("Copy failed");
    }
  }

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
            selection={selection}
            copyStatus={copyStatus}
            onHover={setHovered}
            onResidueClick={handleResidueClick}
            onCopySelection={copySelectedSequence}
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
  selection,
  copyStatus,
  onHover,
  onResidueClick,
  onCopySelection,
  onLeave
}: AlignmentBlockProps) {
  const blockHovered =
    hovered && hovered.alignmentColumn >= start + 1 && hovered.alignmentColumn <= end ? hovered : undefined;
  const hoveredColumn = blockHovered ? alignment.columns[blockHovered.alignmentColumn - 1] : undefined;
  const selectionDetails = getSelectionDetails(selection, alignment);
  const range = getSelectionRange(selection);
  const previewRange = getPreviewRange(selection, hovered);
  const selectionDisplayColumn = selection?.focus?.alignmentColumn ?? selection?.anchor.alignmentColumn;
  const showSelectionBar = Boolean(
    selectionDetails && selectionDisplayColumn && selectionDisplayColumn >= start + 1 && selectionDisplayColumn <= end
  );
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
                const isSelected = isResidueSelected(selection, range, sequence.id, alignmentColumn);
                const isPreviewed = isResiduePreviewed(previewRange, sequence.id, alignmentColumn);

                return (
                  <span
                    key={`${sequence.id}-${alignmentColumn}`}
                    className={`${getResidueClassName(char, colorMode, alignment.sequenceType, column)} ${
                      isHovered ? "residue-hovered" : ""
                    } ${isSelected ? "residue-selected" : ""} ${isPreviewed ? "residue-selection-preview" : ""}`}
                    data-residue-cell="true"
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
                    onClick={(event) => {
                      event.stopPropagation();
                      onResidueClick({
                        sequenceId: sequence.id,
                        alignmentColumn,
                        originalCoordinate,
                        originalLength: sequence.originalLength,
                        char,
                        isGap: originalCoordinate === null
                      });
                    }}
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
      {showSelectionBar && selectionDetails ? (
        <SelectionBar details={selectionDetails} copyStatus={copyStatus} onCopy={onCopySelection} />
      ) : null}
    </section>
  );
}

function SelectionBar({
  details,
  copyStatus,
  onCopy
}: {
  details: SelectionDetails;
  copyStatus?: string;
  onCopy: (details: SelectionDetails) => void;
}) {
  const hasRange = details.startColumn !== details.endColumn;
  const originalRange =
    details.originalStart !== undefined && details.originalEnd !== undefined
      ? `${details.originalStart}-${details.originalEnd}`
      : "gap-only";

  return (
    <div
      className="rounded border border-emerald-300 bg-white p-3 text-sm text-stone-900"
      data-selection-ui="true"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <InfoPair label="Selected sequence" value={details.sequenceId} />
        <InfoPair label="Alignment columns" value={`${details.startColumn}-${details.endColumn}`} />
        <InfoPair label="Original coordinates" value={originalRange} />
        <InfoPair label="Ungapped length" value={String(details.sequence.length)} />
        <button
          type="button"
          disabled={!hasRange}
          onClick={() => onCopy(details)}
          className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          Copy range
        </button>
        {copyStatus ? <span className="text-sm text-stone-700">{copyStatus}</span> : null}
      </div>
      {!hasRange ? <div className="mt-2 text-xs text-stone-600">Click another residue on this sequence to select a range.</div> : null}
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-normal text-stone-600">{label}</div>
      <div className="mt-0.5 font-semibold text-stone-950">{value}</div>
    </div>
  );
}

function getSelectionRange(selection: ResidueSelection | undefined):
  | { sequenceId: string; startColumn: number; endColumn: number }
  | undefined {
  if (!selection?.focus || selection.anchor.sequenceId !== selection.focus.sequenceId) {
    return undefined;
  }

  return {
    sequenceId: selection.anchor.sequenceId,
    startColumn: Math.min(selection.anchor.alignmentColumn, selection.focus.alignmentColumn),
    endColumn: Math.max(selection.anchor.alignmentColumn, selection.focus.alignmentColumn)
  };
}

function getPreviewRange(
  selection: ResidueSelection | undefined,
  hovered: ViewerState["hovered"]
): { sequenceId: string; startColumn: number; endColumn: number } | undefined {
  if (!selection || selection.focus || !hovered || selection.anchor.sequenceId !== hovered.sequenceId) {
    return undefined;
  }

  return {
    sequenceId: selection.anchor.sequenceId,
    startColumn: Math.min(selection.anchor.alignmentColumn, hovered.alignmentColumn),
    endColumn: Math.max(selection.anchor.alignmentColumn, hovered.alignmentColumn)
  };
}

function isResidueSelected(
  selection: ResidueSelection | undefined,
  range: ReturnType<typeof getSelectionRange>,
  sequenceId: string,
  alignmentColumn: number
): boolean {
  if (!selection) {
    return false;
  }

  if (range) {
    return sequenceId === range.sequenceId && alignmentColumn >= range.startColumn && alignmentColumn <= range.endColumn;
  }

  return selection.anchor.sequenceId === sequenceId && selection.anchor.alignmentColumn === alignmentColumn;
}

function isResiduePreviewed(
  previewRange: ReturnType<typeof getPreviewRange>,
  sequenceId: string,
  alignmentColumn: number
): boolean {
  return Boolean(
    previewRange &&
      sequenceId === previewRange.sequenceId &&
      alignmentColumn >= previewRange.startColumn &&
      alignmentColumn <= previewRange.endColumn
  );
}

function getSelectionDetails(selection: ResidueSelection | undefined, alignment: AlignResponse): SelectionDetails | undefined {
  if (!selection) {
    return undefined;
  }

  const range = getSelectionRange(selection) ?? {
    sequenceId: selection.anchor.sequenceId,
    startColumn: selection.anchor.alignmentColumn,
    endColumn: selection.anchor.alignmentColumn
  };
  const sequence = alignment.sequences.find((candidate) => candidate.id === range.sequenceId);
  if (!sequence) {
    return undefined;
  }

  const alignedSequence = sequence.alignedSequence.slice(range.startColumn - 1, range.endColumn);
  const ungappedSequence = [...alignedSequence].filter((char) => char !== "-" && char !== ".").join("");
  const originalCoordinates = sequence.alignmentToOriginal
    .slice(range.startColumn - 1, range.endColumn)
    .filter((coordinate): coordinate is number => coordinate !== null);

  return {
    sequenceId: sequence.id,
    startColumn: range.startColumn,
    endColumn: range.endColumn,
    originalStart: originalCoordinates[0],
    originalEnd: originalCoordinates[originalCoordinates.length - 1],
    alignedSequence,
    sequence: ungappedSequence
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
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
