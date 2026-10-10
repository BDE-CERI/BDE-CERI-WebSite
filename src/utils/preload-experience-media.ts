import type { ExperienceMediaResource } from "@/utils/experience-media";

const preloadedUrls = new Set<string>();

export type ExperiencePreloadProgress = {
  total: number;
  completed: number;
  loaded: number;
  failed: number;
};

export async function preloadExperienceMedia(
  resources: ExperienceMediaResource[],
  onProgress?: (progress: ExperiencePreloadProgress) => void,
) {
  const pending = resources.filter(resource => !preloadedUrls.has(resource.url));
  const progress: ExperiencePreloadProgress = {
    total: pending.length,
    completed: 0,
    loaded: 0,
    failed: 0,
  };
  onProgress?.({ ...progress });

  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < pending.length) {
      const resource = pending[nextIndex++];
      try {
        const image = new Image();
        image.decoding = "async";
        image.loading = "eager";
        image.fetchPriority = "low";
        image.src = resource.url;
        let timeoutId = 0;
        await Promise.race([
          image.decode(),
          new Promise<never>((_, reject) => {
            timeoutId = window.setTimeout(() => reject(new Error("Image preload timed out")), 15_000);
          }),
        ]).finally(() => window.clearTimeout(timeoutId));
        preloadedUrls.add(resource.url);
        progress.loaded += 1;
      } catch {
        progress.failed += 1;
      } finally {
        progress.completed += 1;
        onProgress?.({ ...progress });
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(3, pending.length) }, () => worker()));
  return { ...progress };
}

