import { describe, expect, it } from "vitest";
import { parseFasta } from "@/lib/fasta";
import { resolveAndValidateSequenceType } from "@/lib/sequenceType";

describe("parseFasta", () => {
  it("parses multiline FASTA and descriptions", () => {
    const records = parseFasta(`>seq1 first sequence
ACG
TTA
>seq2
GGG
`);

    expect(records).toEqual([
      { id: "seq1", description: "first sequence", sequence: "ACGTTA" },
      { id: "seq2", sequence: "GGG" }
    ]);
  });

  it("rejects duplicate IDs", () => {
    expect(() => parseFasta(">seq\nAAA\n>seq\nCCC\n")).toThrow(/Duplicate/);
  });

  it("rejects empty sequences", () => {
    expect(() => parseFasta(">seq\n>next\nAAA\n")).toThrow(/empty/);
  });

  it("rejects sequence data before a header", () => {
    expect(() => parseFasta("ACGT\n>seq\nAAAA\n")).toThrow(/before the first/);
  });
});

describe("resolveAndValidateSequenceType", () => {
  it("detects DNA and RNA", () => {
    expect(resolveAndValidateSequenceType(parseFasta(">a\nACGT\n>b\nACGN\n"), "auto").sequenceType).toBe("dna");
    expect(resolveAndValidateSequenceType(parseFasta(">a\nACGU\n>b\nACGN\n"), "auto").sequenceType).toBe("rna");
  });

  it("rejects T and U conflicts", () => {
    expect(() => resolveAndValidateSequenceType(parseFasta(">a\nACGT\n>b\nACGU\n"), "auto")).toThrow(/both T and U/);
  });

  it("rejects invalid explicit DNA characters", () => {
    expect(() => resolveAndValidateSequenceType(parseFasta(">a\nACGE\n>b\nACGT\n"), "dna")).toThrow(/invalid DNA/);
  });

  it("rejects gaps in raw FASTA input", () => {
    const records = parseFasta(">a\nAC-G\n>b\nACGG\n");
    expect(() => resolveAndValidateSequenceType(records, "dna")).toThrow(/gap/);
  });
});
