import type { AlignErrorResponse } from "./types";

export class AlignViewError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string;

  constructor(message: string, options: { status?: number; code?: string; details?: string } = {}) {
    super(message);
    this.name = "AlignViewError";
    this.status = options.status ?? 400;
    this.code = options.code ?? "ALIGNVIEW_ERROR";
    this.details = options.details;
  }
}

export function sanitizeDetails(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const compact = value
    .replace(/\r/g, "")
    .replace(/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g, "[path]")
    .replace(/\s+/g, " ")
    .trim();

  return compact.length > 600 ? `${compact.slice(0, 600)}...` : compact || undefined;
}

export function errorToResponse(error: unknown): { status: number; body: AlignErrorResponse } {
  if (error instanceof AlignViewError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        details: sanitizeDetails(error.details)
      }
    };
  }

  return {
    status: 500,
    body: {
      error: "Unexpected alignment server error."
    }
  };
}
