import React from "react";
import LoadingEstimate from "@/components/LoadingEstimate";

export default function Loading() {
  return (
    <div className="bg-surface min-h-screen pt-32 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
      <LoadingEstimate routeKey="evenement" />
      {/* Title Skeleton */}
      <header className="space-y-4">
        <div className="h-4 w-32 bg-surface-container-highest rounded-full animate-pulse" />
        <div className="h-10 w-96 bg-surface-container-highest rounded-xl animate-pulse" />
        <div className="h-6 w-[450px] bg-surface-container-highest rounded-lg animate-pulse" />
      </header>

      {/* Grid of Event Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 h-80 bg-surface-container-high rounded-3xl animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-container-highest/60" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end gap-3">
            <div className="h-4 w-20 bg-surface-container-highest rounded" />
            <div className="h-8 w-64 bg-surface-container-highest rounded-lg" />
            <div className="h-4 w-96 bg-surface-container-highest rounded" />
          </div>
        </div>

        <div className="md:col-span-4 h-80 bg-surface-container-high rounded-3xl animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-container-highest/60" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end gap-3">
            <div className="h-4 w-20 bg-surface-container-highest rounded" />
            <div className="h-8 w-48 bg-surface-container-highest rounded-lg" />
            <div className="h-4 w-32 bg-surface-container-highest rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
