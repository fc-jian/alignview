import { describe, expect, it } from "vitest";
import { buildAlignedSequences, parseAlignedFasta } from "@/lib/alignmentParser";
import { summarizeColumns } from "@/lib/columnSummary";
import { parseFasta } from "@/lib/fasta";

describe("summarizeColumns", () => {
  it("summarizes conserved, mixed, and gap-containing columns", () => {
    const input = parseFasta(">a\nACG\n>b\nATG\n>c\nAG\n");
    const aligned = parseAlignedFasta(">a\nACG\n>b\nATG\n>c\nA-G\n", ["a", "b", "c"]);
    const summaries = summarizeColumns(buildAlignedSequences(input, aligned));

    expect(summaries[0]).toMatchObject({
      alignmentColumn: 1,
      nonGapCount: 3,
      gapCount: 0,
      residues: { A: 3 },
      consensusChar: "A",
      isConserved: true,
      hasGap: false
    });

    expect(summaries[1]).toMatchObject({
      alignmentColumn: 2,
      nonGapCount: 2,
      gapCount: 1,
      residues: { C: 1, T: 1 },
      isConserved: false,
      hasGap: true
    });

    expect(summaries[2]).toMatchObject({
      alignmentColumn: 3,
      nonGapCount: 3,
      gapCount: 0,
      residues: { G: 3 },
      isConserved: true
    });
  });
});
