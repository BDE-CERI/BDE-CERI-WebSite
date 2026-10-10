"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { hasSiteAdminAccess } from "@/utils/member-roles";

type Result = { success: true } | { error: string };

export async function saveContactMapLocation(latitude: number, longitude: number): Promise<Result> {
  try {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("Les coordonnées saisies ne sont pas valides.");
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Reconnectez-vous pour modifier l’emplacement.");

    const { data: member, error: memberError } = await supabase.from("members")
      .select("category, role, is_dev").eq("auth_user_id", user.id).maybeSingle();
    if (memberError || !member || !hasSiteAdminAccess(member.category, member.role, member.is_dev)) {
      throw new Error("La modification de l’emplacement est réservée aux administrateurs du site.");
    }

    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") {
      throw new Error("Confirmez votre authentification à deux facteurs avant de déplacer le point.");
    }

    const { error } = await supabase.from("site_settings").upsert([
      { key: "contact_map_latitude", value: latitude.toFixed(6) },
      { key: "contact_map_longitude", value: longitude.toFixed(6) },
    ], { onConflict: "key" });
    if (error) throw new Error("Les coordonnées n’ont pas pu être enregistrées : " + error.message);

    revalidatePath("/contact");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Les coordonnées n’ont pas pu être enregistrées." };
  }
}
