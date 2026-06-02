import { AlignViewError } from "./errors";
import type { FastaRecord, InputSequenceType, ResolvedSequenceType } from "./types";

const DNA = new Set("ACGTRYSWKMBDHVN");
const RNA = new Set("ACGURYSWKMBDHVN");
const PROTEIN = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ*");

export function resolveAndValidateSequenceType(
  records: FastaRecord[],
  requested: InputSequenceType,
  options: { allowGaps?: boolean } = {}
): { sequenceType: ResolvedSequenceType; warnings: string[] } {
  const allowGaps = options.allowGaps ?? false;

  if (requested !== "auto") {
    validateCharacters(records, requested, allowGaps);
    return { sequenceType: requested, warnings: [] };
  }

  const chars = collectCharacters(records, allowGaps);
  if (chars.has("T") && chars.has("U")) {
    throw new AlignViewError("Input contains both T and U. Select DNA, RNA, or correct the sequences.", {
      code: "SEQUENCE_TYPE_CONFLICT"
    });
  }

  const allDna = allCharsIn(chars, DNA);
  const allRna = allCharsIn(chars, RNA);
  const allProtein = allCharsIn(chars, PROTEIN);

  if (allDna && chars.has("T")) {
    return { sequenceType: "dna", warnings: [] };
  }
  if (allRna && chars.has("U")) {
    return { sequenceType: "rna", warnings: [] };
  }

  const nucleotideUnion = new Set([...DNA, ...RNA]);
  const hasProteinOnlyCharacter = [...chars].some((char) => !nucleotideUnion.has(char));
  if (hasProteinOnlyCharacter && allProtein) {
    return { sequenceType: "protein", warnings: [] };
  }

  if (allDna && allRna) {
    return {
      sequenceType: "unknown",
      warnings: ["Sequence type is ambiguous; only nucleotide ambiguity-compatible symbols were found."]
    };
  }

  if (allProtein) {
    return { sequenceType: "protein", warnings: [] };
  }

  throw new AlignViewError("Input contains characters that are not valid DNA, RNA, or protein symbols.", {
    code: "INVALID_CHARACTERS"
  });
}

function collectCharacters(records: FastaRecord[], allowGaps: boolean): Set<string> {
  const chars = new Set<string>();

  for (const record of records) {
    for (const char of record.sequence.toUpperCase()) {
      if (char === "-") {
        if (allowGaps) {
          continue;
        }
        throw new AlignViewError(`Sequence "${record.id}" contains a gap. Raw FASTA input cannot contain gaps.`, {
          code: "GAP_IN_RAW_INPUT"
        });
      }
      chars.add(char);
    }
  }

  return chars;
}

function validateCharacters(records: FastaRecord[], sequenceType: Exclude<InputSequenceType, "auto">, allowGaps: boolean): void {
  const allowed = sequenceType === "dna" ? DNA : sequenceType === "rna" ? RNA : PROTEIN;

  for (const record of records) {
    for (const char of record.sequence.toUpperCase()) {
      if (char === "-") {
        if (allowGaps) {
          continue;
        }
        throw new AlignViewError(`Sequence "${record.id}" contains a gap. Raw FASTA input cannot contain gaps.`, {
          code: "GAP_IN_RAW_INPUT"
        });
      }

      if (!allowed.has(char)) {
        throw new AlignViewError(`Sequence "${record.id}" contains invalid ${sequenceType.toUpperCase()} character "${char}".`, {
          code: "INVALID_CHARACTERS"
        });
      }
    }
  }
}

function allCharsIn(chars: Set<string>, allowed: Set<string>): boolean {
  for (const char of chars) {
    if (!allowed.has(char)) {
      return false;
    }
  }
  return true;
}
