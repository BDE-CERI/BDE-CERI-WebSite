"use server";

import { createClient } from "@/utils/supabase/server";

export type PastBoardMember = {
  id: string;
  first_name: string;
  last_name?: string;
  hide_last_name: boolean;
  role_label: string;
  study_year?: string;
  photo_url?: string;
};

type ArchivedMember = {
  id: string;
  first_name: string;
  last_name: string;
  role_label: string;
  study_year?: string | null;
  photo_url?: string | null;
};

type MemberPrivacy = {
  first_name?: string | null;
  last_name?: string | null;
  hide_last_name?: boolean | null;
};

function identityKey(member: MemberPrivacy): string | null {
  const normalize = (value?: string | null) => value?.trim().replace(/\s+/g, " ").normalize("NFC").toLocaleLowerCase("fr-FR") || "";
  const firstName = normalize(member.first_name);
  const lastName = normalize(member.last_name);
  return firstName && lastName ? JSON.stringify([firstName, lastName]) : null;
}

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

export async function getPastBoardMembers(bureauId: string): Promise<PastBoardMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ancien_bureau_members")
    .select("id,first_name,last_name,role_label,study_year,photo_url")
    .eq("ancien_bureau_id", bureauId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching past board members:", error);
    return [];
  }

  // Archives have no member foreign key. Apply current privacy preferences by
  // identity, keeping ambiguous, unknown and failed lookups private by default.
  const privacyByIdentity = new Map<string, boolean>();
  try {
    // select(*) also works before the privacy column exists: missing flags hide
    // names. Profile details stay on the server and never enter the public DTO.
    const { data: profiles, error: privacyError } = await supabase.from("members").select("*");
    if (privacyError) {
      console.error("Error fetching past board privacy preferences:", privacyError);
    } else {
      for (const profile of (profiles || []) as MemberPrivacy[]) {
        const key = identityKey(profile);
        if (!key) continue;
        privacyByIdentity.set(key, privacyByIdentity.get(key) === true || profile.hide_last_name !== false);
      }
    }
  } catch (privacyError) {
    privacyByIdentity.clear();
    console.error("Error fetching past board privacy preferences:", privacyError);
  }

  return ((data || []) as ArchivedMember[]).map((member) => {
    const key = identityKey(member);
    const hideLastName = key ? privacyByIdentity.get(key) !== false : true;
    return {
      id: member.id,
      first_name: member.first_name,
      ...(hideLastName ? {} : { last_name: member.last_name }),
      hide_last_name: hideLastName,
      role_label: member.role_label,
      study_year: member.study_year || undefined,
      photo_url: member.photo_url || undefined,
    };
  });
}
