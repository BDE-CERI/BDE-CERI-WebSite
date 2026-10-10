export type ExperienceMediaSection = "brand" | "events" | "news" | "teams" | "members";

export type ExperienceMediaResource = {
  url: string;
  section: ExperienceMediaSection;
};

export type ExperienceMediaManifest = {
  version: string;
  resources: ExperienceMediaResource[];
};

export const EXPERIENCE_MEDIA_SEEN_KEY = "bde_experience_media_seen";
export const EXPERIENCE_MEDIA_AUTO_KEY = "bde_experience_media_auto";

