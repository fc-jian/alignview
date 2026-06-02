import { isGap } from "./coordinateMap";
import type { AlignmentColumnSummary, ColorMode, ResolvedSequenceType } from "./types";

const BASIC_AMINO_ACIDS = new Set(["A", "V", "L", "I", "M", "F", "W", "P"]);
const POLAR_AMINO_ACIDS = new Set(["S", "T", "N", "Q", "C", "Y"]);
const ACIDIC_AMINO_ACIDS = new Set(["D", "E"]);
const BASIC_CHARGED_AMINO_ACIDS = new Set(["K", "R", "H"]);

export function getResidueClassName(
  char: string,
  mode: ColorMode,
  sequenceType: ResolvedSequenceType,
  column?: AlignmentColumnSummary
): string {
  const residue = char.toUpperCase();
  const classes = ["residue"];

  if (isGap(residue)) {
    classes.push("residue-gap");
    return classes.join(" ");
  }

  if (mode === "none") {
    return classes.join(" ");
  }

  if (mode === "gaps") {
    return classes.join(" ");
  }

  if (mode === "conservation") {
    if (column?.isConserved) {
      classes.push("residue-conserved");
    } else if (column?.consensusChar === residue) {
      classes.push("residue-consensus");
    } else {
      classes.push("residue-variable");
    }
    return classes.join(" ");
  }

  if (mode === "difference") {
    if (column?.consensusChar && column.consensusChar !== residue) {
      classes.push("residue-difference");
    } else if (column?.consensusChar === residue) {
      classes.push("residue-consensus");
    }
    return classes.join(" ");
  }

  if (mode === "nucleotide" || (mode === "amino-acid" && sequenceType !== "protein")) {
    classes.push(nucleotideClass(residue));
    return classes.join(" ");
  }

  classes.push(aminoAcidClass(residue));
  return classes.join(" ");
}

function nucleotideClass(char: string): string {
  switch (char) {
    case "A":
      return "residue-nt-a";
    case "C":
      return "residue-nt-c";
    case "G":
      return "residue-nt-g";
    case "T":
    case "U":
      return "residue-nt-tu";
    default:
      return "residue-ambiguous";
  }
}

function aminoAcidClass(char: string): string {
  if (BASIC_AMINO_ACIDS.has(char)) {
    return "residue-aa-hydrophobic";
  }
  if (POLAR_AMINO_ACIDS.has(char)) {
    return "residue-aa-polar";
  }
  if (ACIDIC_AMINO_ACIDS.has(char)) {
    return "residue-aa-acidic";
  }
  if (BASIC_CHARGED_AMINO_ACIDS.has(char)) {
    return "residue-aa-basic";
  }
  return "residue-ambiguous";
}
