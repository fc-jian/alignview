import { AlignViewError } from "./errors";
import type { FastaRecord } from "./types";

export type AlignmentLimits = {
  maxSequences: number;
  maxSequenceLength: number;
  maxTotalLength: number;
  timeoutMs: number;
};

export const DEFAULT_LIMITS: AlignmentLimits = {
  maxSequences: 200,
  maxSequenceLength: 50_000,
  maxTotalLength: 500_000,
  timeoutMs: 60_000
};

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAlignmentLimits(env: NodeJS.ProcessEnv = process.env): AlignmentLimits {
  return {
    maxSequences: readPositiveInt(env.MSA_MAX_SEQUENCES, DEFAULT_LIMITS.maxSequences),
    maxSequenceLength: readPositiveInt(env.MSA_MAX_SEQUENCE_LENGTH, DEFAULT_LIMITS.maxSequenceLength),
    maxTotalLength: readPositiveInt(env.MSA_MAX_TOTAL_LENGTH, DEFAULT_LIMITS.maxTotalLength),
    timeoutMs: readPositiveInt(env.MSA_TIMEOUT_MS, DEFAULT_LIMITS.timeoutMs)
  };
}

export function validateInputLimits(records: FastaRecord[], limits: AlignmentLimits): void {
  if (records.length < 2) {
    throw new AlignViewError("At least two FASTA records are required.", {
      code: "TOO_FEW_SEQUENCES"
    });
  }

  if (records.length > limits.maxSequences) {
    throw new AlignViewError(`Too many sequences. Maximum is ${limits.maxSequences}.`, {
      code: "TOO_MANY_SEQUENCES"
    });
  }

  let totalLength = 0;
  for (const record of records) {
    const length = record.sequence.replace(/-/g, "").length;
    if (length > limits.maxSequenceLength) {
      throw new AlignViewError(
        `Sequence "${record.id}" is too long. Maximum length is ${limits.maxSequenceLength}.`,
        { code: "SEQUENCE_TOO_LONG" }
      );
    }
    totalLength += length;
  }

  if (totalLength > limits.maxTotalLength) {
    throw new AlignViewError(`Input is too large. Maximum total length is ${limits.maxTotalLength}.`, {
      code: "INPUT_TOO_LARGE"
    });
  }
}
