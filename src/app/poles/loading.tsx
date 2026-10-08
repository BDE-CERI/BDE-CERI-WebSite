import React from "react";
import LoadingEstimate from "@/components/LoadingEstimate";

export default function Loading() {
  return (
    <div className="bg-surface min-h-screen pt-32 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
      <LoadingEstimate routeKey="poles" />
      {/* Title Skeletons */}
      <header className="text-center space-y-6">
        <div className="h-6 w-40 bg-surface-container-highest rounded-full mx-auto animate-pulse" />
        <div className="h-12 w-[600px] bg-surface-container-highest rounded-2xl mx-auto animate-pulse" />
        <div className="h-6 w-[500px] bg-surface-container-highest rounded-lg mx-auto animate-pulse" />
      </header>

      {/* Grid of Poles Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 bg-surface-container-high rounded-3xl animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-surface-container-highest/60" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end gap-4">
              <div className="h-6 w-48 bg-surface-container-highest rounded-lg" />
              <div className="h-4 w-96 bg-surface-container-highest rounded" />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest" />
                <div className="w-10 h-10 rounded-full bg-surface-container-highest" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
