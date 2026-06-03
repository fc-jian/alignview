"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import type { AlignRequest, InputSequenceType } from "@/lib/types";

const DEFAULT_FASTA = `>seq1
MKTAYIAKQRQISFVKSHFSRQDILD
>seq2
MKTAYIAKQRTISFVKSHFSRQNILD
>seq3
MKTAYIAKQRQISFVKSHFSRDILD
`;

type SequenceInputProps = {
  onSubmit: (request: AlignRequest) => void;
  isSubmitting: boolean;
  viewerControls?: ReactNode;
};

export function SequenceInput({ onSubmit, isSubmitting, viewerControls }: SequenceInputProps) {
  const [fasta, setFasta] = useState(DEFAULT_FASTA);
  const [sequenceType, setSequenceType] = useState<InputSequenceType>("auto");
  const [full, setFull] = useState(false);
  const [fullIter, setFullIter] = useState(false);
  const [useKimura, setUseKimura] = useState(false);
  const [threads, setThreads] = useState(1);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      inputFormat: "fasta",
      sequenceType,
      fasta,
      options: {
        full,
        fullIter,
        useKimura,
        threads
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <label htmlFor="fasta" className="block text-sm font-medium text-stone-800">
          FASTA
        </label>
        <textarea
          id="fasta"
          value={fasta}
          onChange={(event) => setFasta(event.target.value)}
          className="mt-2 min-h-[360px] w-full resize-y rounded border border-stone-300 bg-stone-50 p-3 font-mono text-sm leading-5 text-stone-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          spellCheck={false}
        />

        {viewerControls ? <div className="mt-3 border-t border-stone-200 pt-3">{viewerControls}</div> : null}
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-800">
            Type
            <select
              value={sequenceType}
              onChange={(event) => setSequenceType(event.target.value as InputSequenceType)}
              className="mt-2 w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="auto">Auto</option>
              <option value="dna">DNA</option>
              <option value="rna">RNA</option>
              <option value="protein">Protein</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-stone-800">
            Threads
            <input
              type="number"
              min={1}
              max={64}
              value={threads}
              onChange={(event) => setThreads(Number.parseInt(event.target.value, 10) || 1)}
              className="mt-2 w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>

        <div className="space-y-2 border-t border-stone-200 pt-4 text-sm text-stone-800">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={full} onChange={(event) => setFull(event.target.checked)} />
            <span>Full distance matrix</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={fullIter} onChange={(event) => setFullIter(event.target.checked)} />
            <span>Full iteration</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useKimura} onChange={(event) => setUseKimura(event.target.checked)} />
            <span>Use Kimura distance correction</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isSubmitting ? "Aligning..." : "Run alignment"}
        </button>
      </div>
    </form>
  );
}
