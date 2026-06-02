import { describe, expect, it } from "vitest";
import { buildAlignedSequences, parseAlignedFasta } from "@/lib/alignmentParser";
import { parseFasta } from "@/lib/fasta";

describe("parseAlignedFasta", () => {
  it("parses equal-length aligned FASTA", () => {
    const records = parseAlignedFasta(">a\nA-C\n>b\nATC\n", ["a", "b"]);
    expect(records.map((record) => record.sequence)).toEqual(["A-C", "ATC"]);
  });

  it("rejects unequal aligned lengths", () => {
    expect(() => parseAlignedFasta(">a\nA-C\n>b\nATCG\n")).toThrow(/unequal/);
  });

  it("rejects missing expected IDs", () => {
    expect(() => parseAlignedFasta(">a\nA-C\n>b\nATC\n", ["a", "c"])).toThrow(/missing/);
  });
});

describe("buildAlignedSequences", () => {
  it("builds coordinate maps from aligned output", () => {
    const input = parseFasta(">a\nAC\n>b\nATC\n");
    const aligned = parseAlignedFasta(">a\nA-C\n>b\nATC\n", ["a", "b"]);

    expect(buildAlignedSequences(input, aligned)[0]).toMatchObject({
      id: "a",
      originalSequence: "AC",
      alignedSequence: "A-C",
      alignmentToOriginal: [1, null, 2],
      originalToAlignment: [1, 3]
    });
  });
});
