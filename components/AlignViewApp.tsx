"use client";

import { useState } from "react";
import { AlignmentViewer } from "./AlignmentViewer";
import { SequenceInput } from "./SequenceInput";
import { ViewerControls } from "./ViewerControls";
import type { AlignErrorResponse, AlignRequest, AlignResponse, ColorMode } from "@/lib/types";

export function AlignViewApp() {
  const [alignment, setAlignment] = useState<AlignResponse | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [details, setDetails] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("conservation");
  const [blockSize, setBlockSize] = useState(80);
  const [showConsensus, setShowConsensus] = useState(true);
  const [showRuler, setShowRuler] = useState(true);

  async function submitAlignment(request: AlignRequest) {
    setIsSubmitting(true);
    setError(undefined);
    setDetails(undefined);

    try {
      const response = await fetch("/api/align", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });

      const payload = (await response.json()) as AlignResponse | AlignErrorResponse;
      if (!response.ok) {
        const errorPayload = payload as AlignErrorResponse;
        setError(errorPayload.error);
        setDetails(errorPayload.details);
        return;
      }

      setAlignment(payload as AlignResponse);
    } catch (fetchError) {
      setError("Could not contact the alignment server.");
      setDetails(fetchError instanceof Error ? fetchError.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-normal text-stone-950">AlignView</h1>
          {alignment ? (
            <div className="text-sm text-stone-600">
              {alignment.sequences.length} sequences / {alignment.alignmentLength} columns
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded border border-stone-300 bg-white p-4">
          <SequenceInput onSubmit={submitAlignment} isSubmitting={isSubmitting} />
        </section>

        <section className="min-w-0">
          <ViewerControls
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            blockSize={blockSize}
            onBlockSizeChange={setBlockSize}
            showConsensus={showConsensus}
            onShowConsensusChange={setShowConsensus}
            showRuler={showRuler}
            onShowRulerChange={setShowRuler}
          />

          {error ? (
            <div className="mt-4 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              <div className="font-semibold">{error}</div>
              {details ? <div className="mt-2 text-red-800">{details}</div> : null}
            </div>
          ) : null}

          {alignment ? (
            <AlignmentViewer
              alignment={alignment}
              colorMode={colorMode}
              blockSize={blockSize}
              showConsensus={showConsensus}
              showRuler={showRuler}
            />
          ) : (
            <div className="mt-4 rounded border border-stone-300 bg-white p-6 text-sm text-stone-600">
              No alignment loaded.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
