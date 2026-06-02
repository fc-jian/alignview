import { describe, expect, it } from "vitest";
import { buildRuler } from "@/components/AlignmentViewer";

describe("buildRuler", () => {
  it("does not label the final column unless it is column 1 or divisible by 10", () => {
    expect(buildRuler(0, 11).join("")).toBe("1       10 ");
    expect(buildRuler(0, 12).join("")).toBe("1       10  ");
  });

  it("labels column 1 and columns divisible by 10", () => {
    expect(buildRuler(0, 10).join("")).toBe("1       10");
    expect(buildRuler(10, 20).join("")).toBe("        20");
  });
});
