import React from "react";
import LoadingEstimate from "@/components/LoadingEstimate";

export default function Loading() {
  return (
    <div className="bg-surface min-h-screen pt-32 px-4 md:px-8 max-w-7xl mx-auto space-y-16">
      <LoadingEstimate routeKey="boutique" />
      {/* Hero Header Skeleton */}
      <header className="text-center space-y-6">
        <div className="h-6 w-48 bg-surface-container-highest rounded-full mx-auto animate-pulse" />
        <div className="h-12 w-96 bg-surface-container-highest rounded-2xl mx-auto animate-pulse" />
        <div className="h-6 w-[500px] bg-surface-container-highest rounded-lg mx-auto animate-pulse" />
      </header>

      {/* Boutique Items Grid */}
      <div className="space-y-8">
        <div className="h-8 w-64 bg-surface-container-highest rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-low rounded-3xl overflow-hidden shadow-lg border border-outline-variant/10 animate-pulse">
              <div className="h-64 bg-surface-container-highest/60" />
              <div className="p-6 space-y-4">
                <div className="h-4 w-16 bg-surface-container-highest rounded" />
                <div className="h-6 w-48 bg-surface-container-highest rounded-lg" />
                <div className="h-4 w-32 bg-surface-container-highest rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
