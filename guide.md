# Guide

## Project Goal

Build a web application for interactive multiple sequence alignment visualization.

The app must allow users to:

1. Input two or more biological sequences.
2. Support DNA, RNA, and protein sequences.
3. Run multiple sequence alignment using `clustalo` as the backend aligner.
4. Display the aligned result interactively:

   * one row per input sequence;
   * a shared alignment-column numbering ruler above the alignment;
   * mouse-hover feedback showing each residue’s original ungapped sequence coordinate;
   * coloring/highlighting for different residue/nucleotide classes and special positions;
   * segmented/block display for long alignments.

This project is not merely a wrapper around Clustal Omega. The main product value is the interactive alignment viewer and coordinate mapping between alignment columns and original sequence positions.

---

## Tech Stack

Use the following stack unless there is a strong technical reason not to:

* Framework: Next.js with App Router
* Language: TypeScript
* UI: React
* Styling: Tailwind CSS or CSS modules
* Backend glue: Next.js Route Handlers
* MSA backend: local `clustalo` command-line binary
* Runtime: Node.js, use `nvm`
* Package manager: pnpm preferred

Do not introduce a separate Python/FastAPI backend unless explicitly requested. The expected architecture is a single Next.js app with server-side glue code that calls `clustalo`.

---

## Core User Flow

The default user flow must be:

1. User opens the web page.
2. User pastes two or more sequences in FASTA format or enters sequences into separate input boxes.
3. User selects sequence type:

   * auto
   * DNA
   * RNA
   * protein
4. User submits the job.
5. Server validates and normalizes input.
6. Server writes input sequences to a temporary FASTA file.
7. Server invokes `clustalo`.
8. Server parses the aligned FASTA output.
9. Server returns structured JSON to the frontend.
10. Frontend renders an interactive alignment viewer.

The frontend must not directly call `clustalo`. All calls to `clustalo` must happen server-side.

---

## Required Features

### 1. Sequence Input

Support at least FASTA input.

The FASTA parser must:

* accept two or more records;
* preserve the user-provided sequence IDs where possible;
* reject empty sequences;
* reject duplicate IDs or normalize them safely;
* trim whitespace;
* allow multiline FASTA sequences;
* provide useful validation errors.

For sequence characters:

* DNA should accept A, C, G, T, N and common IUPAC ambiguity codes.
* RNA should accept A, C, G, U, N and common IUPAC ambiguity codes.
* Protein should accept the standard amino acid alphabet plus common ambiguous symbols such as X, B, Z, J, U, O, and `*` when appropriate.

Do not silently discard invalid characters. Report validation errors clearly.

### 2. MSA Backend

Use the local `clustalo` executable.

Expected command pattern:

```bash
clustalo -i input.fasta -o output.fasta --outfmt=fasta --force
```

Implementation requirements:

* Use a temporary working directory per request.
* Do not write user input into the project directory.
* Clean up temporary files after each run.
* Use `child_process.spawn` or an equivalent safe API.
* Do not use shell interpolation with untrusted user input.
* Enforce a timeout.
* Enforce maximum input limits.
* Capture stderr and expose a sanitized error message to the frontend.
* Return aligned FASTA output parsed into structured JSON.

Reasonable default limits:

* maximum number of sequences: 200
* maximum sequence length: 50,000 residues/nucleotides per sequence
* maximum total input residues: 500,000
* timeout: 60 seconds

These limits may be adjusted, but they must be centralized in configuration.

### 3. API Design

Implement a Route Handler such as:

```text
POST /api/align
```

Request body:

```ts
type AlignRequest = {
  inputFormat: "fasta";
  sequenceType: "auto" | "dna" | "rna" | "protein";
  fasta: string;
  options?: {
    dealign?: boolean;
    full?: boolean;
    fullIter?: boolean;
    threads?: number;
  };
};
```

Response body on success:

```ts
type AlignResponse = {
  jobId: string;
  sequenceType: "dna" | "rna" | "protein" | "unknown";
  alignmentLength: number;
  sequences: AlignedSequence[];
  columns: AlignmentColumnSummary[];
  warnings: string[];
};

type AlignedSequence = {
  id: string;
  description?: string;
  originalSequence: string;
  alignedSequence: string;
  originalLength: number;
  alignedLength: number;

  /**
   * For each alignment column, gives the 1-based original coordinate.
   * Null means the aligned character at that column is a gap.
   */
  alignmentToOriginal: Array<number | null>;

  /**
   * For each original residue/nucleotide coordinate, gives the 1-based
   * alignment column where it appears.
   */
  originalToAlignment: number[];
};

type AlignmentColumnSummary = {
  alignmentColumn: number; // 1-based
  nonGapCount: number;
  gapCount: number;
  residues: Record<string, number>;
  consensusChar?: string;
  isConserved: boolean;
  hasGap: boolean;
};
```

Response body on failure:

```ts
type AlignErrorResponse = {
  error: string;
  details?: string;
};
```

Use 1-based coordinates in all user-facing data.

Use 0-based indexing only internally.

### 4. Coordinate Mapping

This is a critical feature.

For each aligned sequence, compute:

```ts
alignmentToOriginal: Array<number | null>
```

Example:

```text
original:       A C D E F
aligned:        A - C D E F
alignment col:  1 2 3 4 5 6
original coord: 1 - 2 3 4 5
```

Then:

```ts
alignmentToOriginal = [1, null, 2, 3, 4, 5]
```

Also compute:

```ts
originalToAlignment = [1, 3, 4, 5, 6]
```

All frontend hover behavior must use this mapping rather than attempting to infer coordinates from rendered text.

### 5. Alignment Viewer

The viewer must display:

* one row per sequence;
* sequence ID on the left;
* aligned characters on the right;
* a ruler above the alignment;
* fixed-width font for alignment characters;
* horizontal scrolling for wide alignments;
* optional block/segmented view for long sequences.

The default block size should be configurable, for example:

```ts
const DEFAULT_BLOCK_SIZE = 80;
```

In block mode, render alignment as chunks:

```text
columns 1-80
columns 81-160
columns 161-240
...
```

Each block must show:

* alignment ruler;
* all sequence rows;
* optional consensus row;
* optional per-row original coordinate labels at block boundaries.

For very long alignments, avoid rendering the entire alignment naively if it causes performance problems. Use block rendering, windowing, or virtualization.

### 6. Hover Interaction

On mouse hover over any aligned character, show a tooltip or side panel containing:

* sequence ID;
* aligned character;
* alignment column number;
* original sequence coordinate;
* whether the position is a gap;
* optionally, column summary:

  * residue/nucleotide counts;
  * consensus character;
  * conservation status;
  * gap count.

For a gap character, original coordinate must be displayed as `gap` or `null`, not as a misleading number.

Hovering over an alignment column should also visually highlight the same column across all sequence rows.

### 7. Numbering Requirements

The viewer must support two numbering systems simultaneously:

1. Alignment numbering:

   * shared across all sequences;
   * shown above the alignment;
   * counts every alignment column including gaps.

2. Original sequence numbering:

   * specific to each input sequence;
   * shown interactively on hover;
   * counts only non-gap characters in that sequence;
   * must correspond to the original ungapped input sequence.

Do not conflate these two numbering systems.

### 8. Coloring and Highlighting

Implement residue/nucleotide coloring.

Minimum required coloring modes:

* none
* nucleotide coloring
* amino-acid coloring
* identity/conservation coloring
* gap highlighting
* difference-from-consensus highlighting

The color scheme does not need to exactly reproduce Jalview or Clustal coloring, but it must be biologically sensible and documented in code comments.

Users should be able to switch coloring modes from the UI.

Special positions should be highlightable. Design the data model so future user-provided annotations can highlight:

* alignment columns;
* original sequence coordinate ranges;
* sequence-specific positions.

### 9. Long Sequence Handling

The app must handle long sequences gracefully.

Required behavior:

* Do not force the browser to render one enormous unbroken alignment row.
* Provide segmented/block display.
* Provide horizontal scrolling or block navigation.
* Keep sequence labels visible where practical.
* Preserve hover coordinate behavior in every block.

Performance matters. Avoid per-character React components for extremely long alignments if performance becomes poor. Prefer chunked rendering and event delegation when necessary.

### 10. Frontend State

The UI should maintain at least:

```ts
type ViewerState = {
  colorMode: "none" | "nucleotide" | "amino-acid" | "conservation" | "gaps" | "difference";
  blockSize: number;
  showConsensus: boolean;
  showRuler: boolean;
  hovered?: {
    sequenceId: string;
    alignmentColumn: number;
    originalCoordinate: number | null;
    char: string;
  };
};
```

### 11. Error Handling

Provide clear errors for:

* fewer than two sequences;
* invalid FASTA;
* invalid characters;
* sequence type mismatch;
* `clustalo` not installed;
* `clustalo` timeout;
* `clustalo` non-zero exit;
* input too large;
* temporary file write failure;
* output parse failure.

Do not expose raw server stack traces to the user.

### 12. Security Requirements

This app executes a local binary, so security matters.

Mandatory rules:

* Never interpolate user input into shell commands.
* Prefer `spawn("clustalo", args, ...)` with an argument array.
* Use temporary files with randomized names.
* Clean up temporary files.
* Enforce input size limits.
* Enforce execution timeout.
* Sanitize errors.
* Do not allow the user to specify arbitrary command-line arguments.
* Do not expose filesystem paths in frontend errors.
* Do not store submitted sequences permanently unless a persistence feature is explicitly requested.

### 13. Suggested File Structure

Use this structure unless the existing project structure strongly suggests otherwise:

```text
app/
  page.tsx
  api/
    align/
      route.ts

components/
  SequenceInput.tsx
  AlignmentViewer.tsx
  AlignmentBlock.tsx
  AlignmentRuler.tsx
  AlignmentRow.tsx
  HoverTooltip.tsx
  ViewerControls.tsx

lib/
  fasta.ts
  sequenceType.ts
  clustalo.ts
  alignmentParser.ts
  coordinateMap.ts
  columnSummary.ts
  coloring.ts
  limits.ts
  types.ts

tests/
  fasta.test.ts
  coordinateMap.test.ts
  columnSummary.test.ts
  alignmentParser.test.ts
  api-align.test.ts
```

### 14. Important Implementation Details

#### FASTA Parser

Implement a strict but user-friendly FASTA parser.

It should return:

```ts
type FastaRecord = {
  id: string;
  description?: string;
  sequence: string;
};
```

Preserve descriptions separately from IDs.

#### Sequence Type Detection

Implement `detectSequenceType(records)`.

Rules:

* If all sequences contain only DNA-compatible characters and T is used, infer DNA.
* If all sequences contain only RNA-compatible characters and U is used, infer RNA.
* If both T and U appear in the same dataset, warn or reject unless explicitly allowed.
* If amino-acid-only characters appear, infer protein.
* If ambiguous, return `unknown` and ask the user to select manually.

Do not over-engineer this. Keep the logic transparent and tested.

#### Clustal Omega Wrapper

Implement a function like:

```ts
async function runClustalOmega(inputFasta: string, options: ClustalOptions): Promise<string>
```

The wrapper should:

* create a temporary directory;
* write input FASTA;
* call `clustalo`;
* read output FASTA;
* clean up;
* throw typed errors.

#### Aligned FASTA Parser

Parse output FASTA into aligned sequences.

Validate that:

* all aligned sequences have equal aligned length;
* every output sequence corresponds to an input sequence;
* no sequence is silently dropped.

#### Coordinate Map

Implement and test:

```ts
function buildCoordinateMap(alignedSequence: string): {
  alignmentToOriginal: Array<number | null>;
  originalToAlignment: number[];
}
```

Coordinates must be 1-based in the returned user-facing data.

#### Column Summary

Implement:

```ts
function summarizeColumns(alignedSequences: AlignedSequence[]): AlignmentColumnSummary[]
```

This must compute residue counts, gap counts, non-gap counts, consensus character, and conservation status.

### 15. Testing Requirements

Add tests for core logic before or while implementing UI.

Minimum tests:

* FASTA parsing:

  * multiline FASTA;
  * duplicate IDs;
  * invalid characters;
  * empty sequence;
  * descriptions.
* Coordinate mapping:

  * no gaps;
  * leading gaps;
  * internal gaps;
  * trailing gaps;
  * all-gap column.
* Column summaries:

  * conserved column;
  * mixed residues;
  * gap-containing column.
* Aligned FASTA parser:

  * equal lengths;
  * unequal lengths should fail.
* API:

  * rejects fewer than two sequences;
  * rejects invalid FASTA;
  * handles missing `clustalo` gracefully.

If integration testing with real `clustalo` is hard in CI, mock the clustalo wrapper for API tests and keep one optional integration test gated by environment variable.

### 16. Manual Acceptance Criteria

The app is acceptable when all of the following are true:

1. A user can paste at least three protein sequences in FASTA format and obtain a visible MSA.
2. A user can paste at least three DNA or RNA sequences in FASTA format and obtain a visible MSA.
3. The alignment viewer shows one row per input sequence.
4. The top ruler shows alignment-column numbering.
5. Hovering over a residue shows:

   * sequence ID;
   * alignment column;
   * original ungapped coordinate;
   * residue character.
6. Hovering over a gap clearly reports that the original coordinate is absent.
7. Long alignments are displayed in blocks rather than as one unreadable line.
8. Coloring modes can be switched.
9. Difference/conservation highlighting works.
10. Errors are clear when input is invalid.
11. The app handles missing `clustalo` with a useful error message.
12. The implementation includes tests for FASTA parsing and coordinate mapping.

### 17. Non-Goals for the First Version

Do not implement these unless explicitly requested:

* user accounts;
* persistent job database;
* cloud job queue;
* BLAST search;
* structure viewer;
* phylogenetic tree viewer;
* pairwise dot plot;
* editing aligned residues manually;
* uploading huge datasets beyond local machine limits;
* collaboration features.

### 18. Development Priorities

Implement in this order:

1. FASTA parser and validation.
2. Clustal Omega server wrapper.
3. `/api/align` route.
4. Aligned FASTA parser.
5. Coordinate mapping.
6. Minimal alignment viewer.
7. Hover tooltip with original coordinate.
8. Ruler and block display.
9. Coloring and highlighting.
10. Tests and polish.

Do not start with UI polish before the backend and coordinate model are correct.

### 19. Coding Style

* Use TypeScript types explicitly for core data structures.
* Keep biological coordinate logic in pure functions under `lib/`.
* Keep React components mostly presentational.
* Avoid mixing `clustalo` process logic into UI components.
* Prefer small, tested functions.
* Use descriptive error classes or error codes.
* Comment coordinate conventions clearly.

### 20. Documentation

Add or update `README.md` with:

* project purpose;
* installation instructions;
* how to install `clustalo`;
* how to run the dev server;
* example FASTA input;
* known limits;
* explanation of alignment coordinates vs original sequence coordinates.

Mention clearly that `clustalo` must be available on the server PATH, or configurable through an environment variable such as:

```bash
CLUSTALO_BIN=/usr/local/bin/clustalo
```

### 21. Environment Variables

Support:

```bash
CLUSTALO_BIN=clustalo
MSA_TIMEOUT_MS=60000
MSA_MAX_SEQUENCES=200
MSA_MAX_SEQUENCE_LENGTH=50000
MSA_MAX_TOTAL_LENGTH=500000
```

Provide sensible defaults if these are not set.

### 22. Example Input for Testing

Use this protein example during development:

```fasta
>seq1
MKTAYIAKQRQISFVKSHFSRQDILD
>seq2
MKTAYIAKQRTISFVKSHFSRQNILD
>seq3
MKTAYIAKQRQISFVKSHFSR-DILD
```

Use this nucleotide example:

```fasta
>dna1
ATGCGTACGTAGCTAGCTAG
>dna2
ATGCGTACGTTGCTAGCTAG
>dna3
ATGCGTACGTAGCTAGATAG
```

The app should also work when input sequences are unaligned. The `-` character should generally be rejected in raw unaligned user input unless an explicit “input may already contain gaps” option is added.

### 23. Final Deliverable

The final deliverable should be a working Next.js application that can be run locally with:

```bash
pnpm install
pnpm dev
```

and that performs MSA by calling local `clustalo`.

The result should not be a static mockup. The alignment path from user input to real Clustal Omega output to interactive viewer must work end to end.
