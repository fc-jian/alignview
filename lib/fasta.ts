import { AlignViewError } from "./errors";
import type { FastaRecord } from "./types";

export function parseFasta(input: string): FastaRecord[] {
  if (!input.trim()) {
    throw new AlignViewError("FASTA input is empty.", { code: "EMPTY_FASTA" });
  }

  const records: FastaRecord[] = [];
  const seenIds = new Set<string>();
  let current: { id: string; description?: string; lines: string[] } | undefined;

  for (const [index, rawLine] of input.replace(/\r\n?/g, "\n").split("\n").entries()) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith(">")) {
      if (current) {
        records.push(finalizeRecord(current));
      }

      const header = line.slice(1).trim();
      if (!header) {
        throw new AlignViewError(`FASTA header on line ${index + 1} is empty.`, {
          code: "INVALID_FASTA"
        });
      }

      const [id, ...descriptionParts] = header.split(/\s+/);
      if (seenIds.has(id)) {
        throw new AlignViewError(`Duplicate FASTA record ID "${id}".`, {
          code: "DUPLICATE_ID"
        });
      }
      seenIds.add(id);

      current = {
        id,
        description: descriptionParts.length ? descriptionParts.join(" ") : undefined,
        lines: []
      };
      continue;
    }

    if (!current) {
      throw new AlignViewError(`Sequence data appears before the first FASTA header on line ${index + 1}.`, {
        code: "INVALID_FASTA"
      });
    }

    current.lines.push(line.replace(/\s+/g, ""));
  }

  if (current) {
    records.push(finalizeRecord(current));
  }

  if (records.length === 0) {
    throw new AlignViewError("No FASTA records were found.", { code: "INVALID_FASTA" });
  }

  return records;
}

function finalizeRecord(record: { id: string; description?: string; lines: string[] }): FastaRecord {
  const sequence = record.lines.join("").toUpperCase();
  if (!sequence) {
    throw new AlignViewError(`Sequence "${record.id}" is empty.`, {
      code: "EMPTY_SEQUENCE"
    });
  }

  return {
    id: record.id,
    description: record.description,
    sequence
  };
}

export function recordsToFasta(records: FastaRecord[]): string {
  return `${records
    .map((record) => {
      const header = record.description ? `>${record.id} ${record.description}` : `>${record.id}`;
      const lines = record.sequence.match(/.{1,80}/g) ?? [record.sequence];
      return [header, ...lines].join("\n");
    })
    .join("\n")}\n`;
}
