export function isGap(char: string): boolean {
  return char === "-" || char === ".";
}

export function buildCoordinateMap(alignedSequence: string): {
  alignmentToOriginal: Array<number | null>;
  originalToAlignment: number[];
} {
  const alignmentToOriginal: Array<number | null> = [];
  const originalToAlignment: number[] = [];
  let originalCoordinate = 0;

  for (let index = 0; index < alignedSequence.length; index += 1) {
    const char = alignedSequence[index];
    if (isGap(char)) {
      alignmentToOriginal.push(null);
      continue;
    }

    originalCoordinate += 1;
    const alignmentColumn = index + 1;
    alignmentToOriginal.push(originalCoordinate);
    originalToAlignment.push(alignmentColumn);
  }

  return { alignmentToOriginal, originalToAlignment };
}
