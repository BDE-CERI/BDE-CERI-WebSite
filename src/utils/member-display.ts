export type MemberDisplayIdentity = {
  first_name?: string | null;
  last_name?: string | null;
  hide_last_name?: boolean | null;
};

/** Public display is private by default, including before the schema migration. */
export function getPublicMemberLastName(member: MemberDisplayIdentity): string {
  return member.hide_last_name === false ? member.last_name?.trim() || "" : "";
}

export function getPublicMemberName(member: MemberDisplayIdentity): string {
  return [member.first_name?.trim(), getPublicMemberLastName(member)].filter(Boolean).join(" ");
}
