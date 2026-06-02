import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AlignViewError, sanitizeDetails } from "./errors";
import type { AlignRequest } from "./types";

export type ClustalOptions = NonNullable<AlignRequest["options"]> & {
  timeoutMs: number;
};

export async function runClustalOmega(inputFasta: string, options: ClustalOptions): Promise<string> {
  const workDir = await mkdtemp(join(tmpdir(), "alignview-"));
  const inputPath = join(workDir, "input.fasta");
  const outputPath = join(workDir, "output.fasta");

  try {
    await writeFile(inputPath, inputFasta, "utf8");

    const args = ["-i", inputPath, "-o", outputPath, "--outfmt=fasta", "--force"];
    if (options.full) {
      args.push("--full");
    }
    if (options.fullIter) {
      args.push("--full-iter");
    }
    if (options.useKimura) {
      args.push("--use-kimura");
    }
    if (Number.isInteger(options.threads) && options.threads && options.threads > 0) {
      args.push("--threads", String(Math.min(options.threads, 64)));
    }

    const binary = process.env.CLUSTALO_BIN || "clustalo";
    await runProcess(binary, args, options.timeoutMs);

    return await readFile(outputPath, "utf8");
  } catch (error) {
    if (error instanceof AlignViewError) {
      throw error;
    }

    throw new AlignViewError("Unable to run Clustal Omega.", {
      status: 500,
      code: "CLUSTALO_FAILURE",
      details: error instanceof Error ? error.message : undefined
    });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function runProcess(binary: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let stderr = "";
    let stdout = "";
    let timedOut = false;

    const child = spawn(binary, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > 8000) {
        stdout = stdout.slice(-8000);
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      if (stderr.length > 8000) {
        stderr = stderr.slice(-8000);
      }
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (error.code === "ENOENT") {
        reject(
          new AlignViewError("Clustal Omega is not installed or CLUSTALO_BIN is invalid.", {
            status: 500,
            code: "CLUSTALO_NOT_FOUND"
          })
        );
        return;
      }

      reject(
        new AlignViewError("Failed to start Clustal Omega.", {
          status: 500,
          code: "CLUSTALO_START_FAILURE",
          details: error.message
        })
      );
    });

    child.on("close", (code) => {
      clearTimeout(timer);

      if (timedOut) {
        reject(
          new AlignViewError("Clustal Omega timed out.", {
            status: 504,
            code: "CLUSTALO_TIMEOUT"
          })
        );
        return;
      }

      if (code !== 0) {
        reject(
          new AlignViewError("Clustal Omega failed to align the input.", {
            status: 500,
            code: "CLUSTALO_NON_ZERO_EXIT",
            details: sanitizeDetails(stderr)
          })
        );
        return;
      }

      resolve();
    });
  });
}
