---
name: alignment-viewer
description: Use when implementing or reviewing AlignView frontend UI for alignment rendering, block display, rulers, hover feedback, coloring modes, conservation/difference highlighting, and long-alignment performance.
---

# Alignment Viewer

Build the actual viewer first, not a marketing page. Keep React components presentational and driven by API data.

## Required UI

- One row per sequence with fixed-width alignment characters.
- Sequence IDs stay visible where practical.
- Shared alignment-column ruler above rows.
- Hover state shows sequence ID, character, alignment column, original coordinate, gap status, and useful column summary.
- Highlight the hovered alignment column across rows.
- Long alignments render in blocks or windows, defaulting to a configurable block size such as 80.

## Numbering

- Alignment numbering counts every column, including gaps.
- Original numbering is sequence-specific and counts only non-gap input residues.
- Never conflate these systems in labels, hover text, or annotations.

## Coloring

Support at least `none`, `nucleotide`, `amino-acid`, `conservation`, `gaps`, and `difference`. Keep schemes biologically sensible and document any non-obvious residue grouping in code comments.

## Performance

Avoid a per-character React component strategy for very long alignments if it causes poor rendering. Prefer chunked rendering and event delegation when needed, while preserving hover coordinate behavior.
