---
name: msa-backend
description: Use when implementing or reviewing AlignView server-side alignment work, including FASTA validation, sequence type handling, Clustal Omega invocation, /api/align, limits, temp files, and sanitized errors.
---

# MSA Backend

Follow `AGENTS.md` and `guide.md`; keep this skill focused on server-side alignment.

## Required Shape

- Implement `POST /api/align` as a Next.js Route Handler.
- Accept FASTA input and `sequenceType: "auto" | "dna" | "rna" | "protein"`.
- Return structured JSON with aligned sequences, coordinate maps, column summaries, and warnings.
- Keep frontend code completely separate from `clustalo` process execution.

## Safety Rules

- Call Clustal Omega with `spawn(binary, args)`, never shell interpolation.
- Use a randomized per-request temp directory outside the project.
- Always clean up temp files.
- Enforce centralized limits and timeout.
- Sanitize stderr and avoid returning stack traces or filesystem paths.
- Do not allow arbitrary command-line options from the user.

## Defaults

- `CLUSTALO_BIN=clustalo`
- `MSA_TIMEOUT_MS=60000`
- `MSA_MAX_SEQUENCES=200`
- `MSA_MAX_SEQUENCE_LENGTH=50000`
- `MSA_MAX_TOTAL_LENGTH=500000`

## Tests

Cover invalid FASTA, too few sequences, invalid characters, duplicate IDs, missing `clustalo`, timeout, and non-zero process exit. Mock `clustalo` for routine API tests.
