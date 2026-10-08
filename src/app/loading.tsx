import LoadingEstimate from "@/components/LoadingEstimate";

export default function Loading() {
  return (
    <div className="min-h-[70vh] px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <LoadingEstimate routeKey="global" />
      </div>
      <div className="mx-auto max-w-7xl animate-pulse space-y-10" aria-hidden="true">
        <div className="space-y-4">
          <div className="h-4 w-36 rounded-full bg-surface-container-highest" />
          <div className="h-12 w-2/3 max-w-2xl rounded-xl bg-surface-container-highest" />
          <div className="h-5 w-full max-w-xl rounded-lg bg-surface-container-highest" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 rounded-3xl bg-surface-container-high" />
          ))}
        </div>
      </div>
    </div>
  );
}
