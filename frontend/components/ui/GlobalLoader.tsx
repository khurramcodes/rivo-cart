"use client";

import { LOADER_IMAGE_SRC, LOADER_TEXT } from "@/config/loader";

export function GlobalLoader() {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="flex flex-col items-center gap-3 rounded-lg bg-white px-6 py-4 shadow-lg">
        {LOADER_IMAGE_SRC ? (
          <img src={LOADER_IMAGE_SRC} alt={LOADER_TEXT} className="h-12 w-12" />
        ) : (
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        )}
        <p className="text-sm text-zinc-700">{LOADER_TEXT}</p>
      </div>
    </div>
  );
}
