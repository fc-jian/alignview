import { AlignViewError } from "./errors";
import { parseFasta } from "./fasta";
import { buildCoordinateMap, isGap } from "./coordinateMap";
import type { AlignedSequence, FastaRecord } from "./types";

export function parseAlignedFasta(input: string, expectedIds?: string[]): FastaRecord[] {
  const records = parseFasta(input);

  const lengths = new Set(records.map((record) => record.sequence.length));
  if (lengths.size !== 1) {
    throw new AlignViewError("Aligned FASTA output has unequal sequence lengths.", {
      code: "UNEQUAL_ALIGNMENT_LENGTHS"
    });
  }

  if (expectedIds) {
    const expected = new Set(expectedIds);
    const output = new Set(records.map((record) => record.id));

    for (const id of expected) {
      if (!output.has(id)) {
        throw new AlignViewError(`Clustal Omega output is missing sequence "${id}".`, {
          code: "MISSING_OUTPUT_SEQUENCE"
        });
      }
    }

    for (const id of output) {
      if (!expected.has(id)) {
        throw new AlignViewError(`Clustal Omega output includes unexpected sequence "${id}".`, {
          code: "UNEXPECTED_OUTPUT_SEQUENCE"
        });
      }
    }
  }

  return records;
}

export function buildAlignedSequences(inputRecords: FastaRecord[], alignedRecords: FastaRecord[]): AlignedSequence[] {
  const inputById = new Map(inputRecords.map((record) => [record.id, record]));

  return alignedRecords.map((alignedRecord) => {
    const inputRecord = inputById.get(alignedRecord.id);
    if (!inputRecord) {
      throw new AlignViewError(`Aligned sequence "${alignedRecord.id}" does not match an input record.`, {
        code: "UNEXPECTED_OUTPUT_SEQUENCE"
      });
    }

    const originalSequence = inputRecord.sequence.replace(/-/g, "");
    const alignedSequence = alignedRecord.sequence.toUpperCase();
    const { alignmentToOriginal, originalToAlignment } = buildCoordinateMap(alignedSequence);

    const nonGapCount = [...alignedSequence].filter((char) => !isGap(char)).length;
    if (nonGapCount !== originalSequence.length) {
      throw new AlignViewError(`Aligned sequence "${alignedRecord.id}" length does not match its original sequence.`, {
        code: "OUTPUT_LENGTH_MISMATCH"
      });
    }

    return {
      id: inputRecord.id,
      description: inputRecord.description,
      originalSequence,
      alignedSequence,
      originalLength: originalSequence.length,
      alignedLength: alignedSequence.length,
      alignmentToOriginal,
      originalToAlignment
    };
  });
}
