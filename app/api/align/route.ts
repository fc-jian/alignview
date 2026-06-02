import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { buildAlignedSequences, parseAlignedFasta } from "@/lib/alignmentParser";
import { runClustalOmega } from "@/lib/clustalo";
import { summarizeColumns } from "@/lib/columnSummary";
import { AlignViewError, errorToResponse } from "@/lib/errors";
import { parseFasta, recordsToFasta } from "@/lib/fasta";
import { getAlignmentLimits, validateInputLimits } from "@/lib/limits";
import { resolveAndValidateSequenceType } from "@/lib/sequenceType";
import type { AlignRequest, AlignResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse<AlignResponse | { error: string; details?: string }>> {
  try {
    const body = await readJson(request);
    const alignRequest = validateRequestShape(body);
    const limits = getAlignmentLimits();

    const inputRecords = parseFasta(alignRequest.fasta);
    validateInputLimits(inputRecords, limits);

    const { sequenceType, warnings } = resolveAndValidateSequenceType(inputRecords, alignRequest.sequenceType);

    const alignedFasta = await runClustalOmega(recordsToFasta(inputRecords), {
      ...alignRequest.options,
      timeoutMs: limits.timeoutMs
    });
    const alignedRecords = parseAlignedFasta(alignedFasta, inputRecords.map((record) => record.id));
    const sequences = buildAlignedSequences(inputRecords, alignedRecords);
    const columns = summarizeColumns(sequences);

    const response: AlignResponse = {
      jobId: randomUUID(),
      sequenceType,
      alignmentLength: columns.length,
      sequences,
      columns,
      warnings
    };

    return NextResponse.json(response);
  } catch (error) {
    if (!(error instanceof AlignViewError)) {
      console.error("Unexpected align API error", error);
    }
    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

async function readJson(request: NextRequest): Promise<Partial<AlignRequest>> {
  try {
    return (await request.json()) as Partial<AlignRequest>;
  } catch {
    throw new AlignViewError("Request body must be valid JSON.", {
      code: "INVALID_JSON"
    });
  }
}

function validateRequestShape(body: Partial<AlignRequest>): AlignRequest {
  if (body.inputFormat !== "fasta") {
    throw new AlignViewError('Only inputFormat "fasta" is supported.', {
      code: "UNSUPPORTED_INPUT_FORMAT"
    });
  }

  if (!body.fasta || typeof body.fasta !== "string") {
    throw new AlignViewError("Request body must include FASTA text.", {
      code: "MISSING_FASTA"
    });
  }

  if (!body.sequenceType || !["auto", "dna", "rna", "protein"].includes(body.sequenceType)) {
    throw new AlignViewError("Request body must include a valid sequenceType.", {
      code: "INVALID_SEQUENCE_TYPE"
    });
  }

  return {
    inputFormat: "fasta",
    fasta: body.fasta,
    sequenceType: body.sequenceType,
    options: normalizeOptions(body.options)
  };
}

function normalizeOptions(options: AlignRequest["options"]): AlignRequest["options"] {
  if (!options) {
    return {};
  }

  return {
    full: Boolean(options.full),
    fullIter: Boolean(options.fullIter),
    useKimura: Boolean(options.useKimura),
    threads:
      typeof options.threads === "number" && Number.isInteger(options.threads) && options.threads > 0
        ? Math.min(options.threads, 64)
        : undefined
  };
}
