import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export const getCurrentUserContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, member: null };

  const { data: member } = await supabase
    .from("members")
    .select("first_name, last_name, photo_url, category, role_label, role, is_dev, membership_paid, member_assignments(pole_id, poles(name))")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { user, member };
});
