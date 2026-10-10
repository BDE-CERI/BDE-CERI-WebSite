export const BOARD_ROLES = [
  "president",
  "premier_vice_president",
  "vice_president_general",
  "tresorier",
  "secretaire",
  // Older rows may still contain this value from before the enum was aligned.
  "vp_general",
] as const;

const POLE_VICE_PRESIDENT_ROLES = ["vice_president_pole"] as const;

const roleLabels: Record<string, { fr: string; en: string }> = {
  president: { fr: "Président", en: "President" },
  premier_vice_president: { fr: "Premier Vice-Président", en: "First Vice President" },
  vice_president_general: { fr: "Vice-Président Général", en: "General Vice President" },
  vp_general: { fr: "Vice-Président Général", en: "General Vice President" },
  tresorier: { fr: "Trésorier", en: "Treasurer" },
  secretaire: { fr: "Secrétaire", en: "Secretary" },
  vice_president_pole: { fr: "Vice-Président de Pôle", en: "Pole Vice President" },
  charge_mission_pole: { fr: "Chargé de Mission", en: "Project Lead" },
  charge_mission: { fr: "Chargé de Mission", en: "Project Lead" },
  membre_actif: { fr: "Membre Actif", en: "Active Member" },
  adherent: { fr: "Adhérent", en: "Member" },
  membre_honneur: { fr: "Membre d’honneur", en: "Honorary member" },
};

const categoryLabels: Record<string, { fr: string; en: string }> = {
  bureau_restreint: { fr: "Bureau restreint", en: "Executive board" },
  bureau: { fr: "Bureau", en: "Board" },
  membre_actif: { fr: "Membre Actif", en: "Active Member" },
  adherent: { fr: "Adhérent", en: "Member" },
  membre_honneur: { fr: "Membre d’honneur", en: "Honorary member" },
};

export function isBoardRole(role: string | null | undefined): boolean {
  return !!role && (BOARD_ROLES as readonly string[]).includes(role);
}

export function isRestrictedBoardMember(category: string | null | undefined, role: string | null | undefined): boolean {
  return category === "bureau_restreint" || isBoardRole(role);
}

export function hasSiteAdminAccess(category: string | null | undefined, role: string | null | undefined, isDev: boolean | null | undefined): boolean {
  return isDev === true || isRestrictedBoardMember(category, role);
}

export function isPoleVicePresidentRole(role: string | null | undefined): boolean {
  return !!role && (POLE_VICE_PRESIDENT_ROLES as readonly string[]).includes(role);
}

export function isMemberPoleVicePresident(role: string | null | undefined, poleId: string | null | undefined): boolean {
  return !!poleId && isPoleVicePresidentRole(role);
}

export function getMemberRoleLabel(role: string | null | undefined, english = false): string {
  if (!role) return "";
  const known = roleLabels[role];
  return known ? (english ? known.en : known.fr) : role.replaceAll("_", " ");
}

export function getMemberCategoryLabel(category: string | null | undefined, english = false): string {
  if (!category) return "";
  const known = categoryLabels[category];
  return known ? (english ? known.en : known.fr) : category.replaceAll("_", " ");
}

export function getMemberAdminLabel(input: {
  role?: string | null;
  role_label?: string | null;
  category?: string | null;
}, english = false): { primary: string; category: string } {
  const activeMember = input.category === "membre_actif";
  const category = getMemberCategoryLabel(input.category, english);
  const primary = (activeMember ? "" : input.role_label?.trim()) || getMemberRoleLabel(input.role, english) || category;
  return {
    primary,
    category: category === primary ? "" : category,
  };
}
