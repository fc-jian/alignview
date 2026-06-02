# AlignView Agent Notes

Build a Next.js App Router TypeScript app for interactive multiple sequence alignment visualization. The core value is the viewer and reliable mapping between alignment columns and original ungapped sequence coordinates, not a thin `clustalo` wrapper.

## Stack

- Use Next.js App Router, React, TypeScript, and Tailwind CSS or CSS modules.
- Use Next.js Route Handlers for backend glue; do not add a Python/FastAPI service unless explicitly requested.
- Prefer `pnpm` and `nvm`.
- Run local Clustal Omega through `CLUSTALO_BIN`, defaulting to `clustalo`.

## Architecture Rules

- The frontend must never call `clustalo` directly.
- Implement `POST /api/align` server-side: validate FASTA, write to a per-request temp directory, run `spawn(CLUSTALO_BIN, args)`, parse aligned FASTA, return structured JSON.
- Never interpolate user input into shell commands.
- Clean up temp files, enforce timeout and input limits, and sanitize errors before returning them.
- Keep limits centralized: sequences, per-sequence length, total length, timeout.

## Data And Coordinates

- Use 1-based coordinates in all user-facing API data.
- Keep 0-based indexing internal only.
- For every aligned sequence, compute both `alignmentToOriginal: Array<number | null>` and `originalToAlignment: number[]`.
- Hover behavior must use these maps, never inferred rendered text positions.
- Gaps must report `null` or `gap` for original coordinates.

## Implementation Priorities

1. FASTA parser and validation.
2. Clustal Omega wrapper and `/api/align`.
3. Aligned FASTA parser.
4. Coordinate maps and column summaries.
5. Minimal alignment viewer with ruler, rows, block display, hover tooltip.
6. Coloring modes, conservation/difference highlighting, tests, and polish.

## Testing Focus

- Unit test FASTA parsing, sequence type detection, aligned FASTA parsing, coordinate mapping, and column summaries.
- API tests should mock the clustalo wrapper when real `clustalo` is unavailable.
- Keep one optional real-clustalo integration test gated by an environment variable.

## Non-Goals For The First Version

Do not add user accounts, persistent job storage, queues, BLAST, structure viewers, phylogenetic trees, dot plots, manual alignment editing, or collaboration features unless explicitly requested.
