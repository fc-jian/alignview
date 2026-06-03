---
name: alignment-model
description: Use when implementing or reviewing AlignView core data logic (parsed FASTA records, aligned FASTA parsing, 1-based coordinate maps, original/alignment numbering, column summaries, consensus, conservation, and sequence type detection).
---

# Alignment Model

This project depends on exact coordinate semantics. Prefer pure, typed functions under `lib/` with direct unit tests.

## Coordinate Rules

- Returned coordinates are 1-based for user-facing data.
- Internal loops may use 0-based indexing only inside the function.
- `alignmentToOriginal[columnIndex]` is the original ungapped coordinate or `null` for a gap.
- `originalToAlignment[originalIndex]` is the 1-based alignment column.
- Hover and annotations must consume these maps rather than recomputing positions from rendered strings.

## Parsers

- FASTA parser accepts multiline records, preserves IDs and descriptions, rejects empty sequences, reports invalid characters, and handles duplicate IDs safely.
- Raw unaligned input should generally reject `-` unless a future explicit prealigned/dealign option is added.
- Aligned FASTA parser must require equal aligned lengths and verify output IDs match input records.

## Summaries

Column summaries must include alignment column, residue counts, gap count, non-gap count, consensus character when useful, conservation status, and gap presence.

## Tests

Test no gaps, leading/internal/trailing gaps, all-gap columns, conserved columns, mixed residues, invalid aligned lengths, ambiguous sequence types, and T/U conflicts.
