import { describe, expect, it } from "vitest";
import { buildCoordinateMap } from "@/lib/coordinateMap";

describe("buildCoordinateMap", () => {
  it("maps sequences without gaps", () => {
    expect(buildCoordinateMap("ACDE")).toEqual({
      alignmentToOriginal: [1, 2, 3, 4],
      originalToAlignment: [1, 2, 3, 4]
    });
  });

  it("maps leading gaps", () => {
    expect(buildCoordinateMap("--AC")).toEqual({
      alignmentToOriginal: [null, null, 1, 2],
      originalToAlignment: [3, 4]
    });
  });

  it("maps internal gaps", () => {
    expect(buildCoordinateMap("A-CD-E")).toEqual({
      alignmentToOriginal: [1, null, 2, 3, null, 4],
      originalToAlignment: [1, 3, 4, 6]
    });
  });

  it("maps trailing gaps", () => {
    expect(buildCoordinateMap("AC--")).toEqual({
      alignmentToOriginal: [1, 2, null, null],
      originalToAlignment: [1, 2]
    });
  });
});
