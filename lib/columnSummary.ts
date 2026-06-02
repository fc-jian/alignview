import { isGap } from "./coordinateMap";
import { AlignViewError } from "./errors";
import type { AlignedSequence, AlignmentColumnSummary } from "./types";

export function summarizeColumns(sequences: AlignedSequence[]): AlignmentColumnSummary[] {
  if (sequences.length === 0) {
    return [];
  }

  const alignmentLength = sequences[0].alignedLength;
  if (sequences.some((sequence) => sequence.alignedLength !== alignmentLength)) {
    throw new AlignViewError("Cannot summarize columns for sequences with unequal aligned lengths.", {
      code: "UNEQUAL_ALIGNMENT_LENGTHS"
    });
  }

  const summaries: AlignmentColumnSummary[] = [];

  for (let index = 0; index < alignmentLength; index += 1) {
    const residues: Record<string, number> = {};
    let gapCount = 0;

    for (const sequence of sequences) {
      const char = sequence.alignedSequence[index].toUpperCase();
      if (isGap(char)) {
        gapCount += 1;
      } else {
        residues[char] = (residues[char] ?? 0) + 1;
      }
    }

    const nonGapCount = sequences.length - gapCount;
    const consensusEntry = Object.entries(residues).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const consensusChar = consensusEntry?.[0];
    const isConserved = Boolean(consensusEntry && consensusEntry[1] === sequences.length && gapCount === 0);

    summaries.push({
      alignmentColumn: index + 1,
      nonGapCount,
      gapCount,
      residues,
      consensusChar,
      isConserved,
      hasGap: gapCount > 0
    });
  }

  return summaries;
}
