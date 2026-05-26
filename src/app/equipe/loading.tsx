import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen pt-32 px-4 md:px-8 max-w-7xl mx-auto space-y-12">
      <header className="space-y-4">
        <div className="h-4 w-32 bg-surface-container-highest rounded-full animate-pulse" />
        <div className="h-10 w-64 bg-surface-container-highest rounded-xl animate-pulse" />
        <div className="h-6 w-96 bg-surface-container-highest rounded-lg animate-pulse" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[340px] gap-6">
        {/* Large priority skeletons */}
        <div className="md:col-span-2 md:row-span-2 relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 animate-pulse">
          <div className="absolute inset-0 bg-surface-container-highest/60" />
          <div className="absolute inset-0 p-6 flex flex-col justify-end gap-3">
            <div className="h-4 w-24 rounded bg-surface-container-highest" />
            <div className="h-6 w-40 rounded bg-surface-container-highest" />
          </div>
        </div>
        
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="md:col-span-2 md:row-span-1 relative w-full h-full rounded-xl overflow-hidden bg-surface-container-high shadow-lg outline outline-1 outline-outline-variant/15 animate-pulse">
            <div className="absolute inset-0 bg-surface-container-highest/60" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end gap-3">
              <div className="h-4 w-24 rounded bg-surface-container-highest" />
              <div className="h-6 w-40 rounded bg-surface-container-highest" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
