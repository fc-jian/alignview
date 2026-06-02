export type InputSequenceType = "auto" | "dna" | "rna" | "protein";
export type ResolvedSequenceType = "dna" | "rna" | "protein" | "unknown";
export type ColorMode = "none" | "nucleotide" | "amino-acid" | "conservation" | "gaps" | "difference";

export type FastaRecord = {
  id: string;
  description?: string;
  sequence: string;
};

export type AlignRequest = {
  inputFormat: "fasta";
  sequenceType: InputSequenceType;
  fasta: string;
  options?: {
    full?: boolean;
    fullIter?: boolean;
    useKimura?: boolean;
    threads?: number;
  };
};

export type AlignmentColumnSummary = {
  alignmentColumn: number;
  nonGapCount: number;
  gapCount: number;
  residues: Record<string, number>;
  consensusChar?: string;
  isConserved: boolean;
  hasGap: boolean;
};

export type AlignedSequence = {
  id: string;
  description?: string;
  originalSequence: string;
  alignedSequence: string;
  originalLength: number;
  alignedLength: number;
  alignmentToOriginal: Array<number | null>;
  originalToAlignment: number[];
};

export type AlignResponse = {
  jobId: string;
  sequenceType: ResolvedSequenceType;
  alignmentLength: number;
  sequences: AlignedSequence[];
  columns: AlignmentColumnSummary[];
  warnings: string[];
};

export type AlignErrorResponse = {
  error: string;
  details?: string;
};

export type ViewerState = {
  colorMode: ColorMode;
  blockSize: number;
  showConsensus: boolean;
  showRuler: boolean;
  hovered?: {
    sequenceId: string;
    alignmentColumn: number;
    originalCoordinate: number | null;
    originalLength: number;
    char: string;
    isGap: boolean;
  };
};
