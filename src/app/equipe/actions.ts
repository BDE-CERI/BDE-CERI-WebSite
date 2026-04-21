"use server";

import { createClient } from "@/utils/supabase/server";

export async function getPastBoards() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ancien_bureau")
    .select("*")
    .order("academic_year", { ascending: false });

  if (error) {
    console.error("Error fetching past boards:", error);
    return [];
  }
  return data;
}

export async function getPastBoardMembers(bureauId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ancien_bureau_members")
    .select("*")
    .eq("ancien_bureau_id", bureauId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching past board members:", error);
    return [];
  }
  return data;
}
