# AlignView

Interactive multiple sequence alignment visualization built with Next.js, TypeScript, and a local Clustal Omega binary.

## Requirements

- Node.js through `nvm`
- `pnpm`
- Clustal Omega available through `CLUSTALO_BIN`

Create a local `.env` from `.env.example` and set `CLUSTALO_BIN` if `clustalo` is not on `PATH`:

```bash
cp .env.example .env
```

## Development

```bash
pnpm install
pnpm dev
```

Run tests:

```bash
pnpm test
```

## Environment

```bash
CLUSTALO_BIN=clustalo
MSA_TIMEOUT_MS=60000
MSA_MAX_SEQUENCES=200
MSA_MAX_SEQUENCE_LENGTH=50000
MSA_MAX_TOTAL_LENGTH=500000
```

## Example FASTA

```fasta
>seq1
MKTAYIAKQRQISFVKSHFSRQDILD
>seq2
MKTAYIAKQRTISFVKSHFSRQNILD
>seq3
MKTAYIAKQRQISFVKSHFSRDILD
```

## Coordinates

Alignment coordinates are shared across all sequences and count every aligned column, including gaps.

Original coordinates are sequence-specific and count only non-gap residues from the original input sequence. The API returns both maps:

- `alignmentToOriginal`: alignment column to original coordinate, or `null` for a gap.
- `originalToAlignment`: original coordinate to alignment column.

Hover behavior in the viewer uses these maps directly.
