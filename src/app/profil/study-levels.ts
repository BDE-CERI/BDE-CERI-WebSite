export const STUDY_LEVEL_OPTIONS = [
  "L1", "L1 (CMI)", "BUT 1", "L1/2", "L2", "L2 (CMI)", "BUT 2", "L2/3", "L3", "L3 (CMI)", "BUT 3",
  "M1 ILSEN", "M1 IA", "M1 SYRIUS", "M1 AI4CI", "M1 ILSEN (CMI)", "M1 IA (CMI)", "M1 SYRIUS (CMI)", "M1 AI4CI (CMI)",
  "M2 ILSEN", "M2 IA", "M2 SYRIUS", "M2 AI4CI", "M2 ILSEN (CMI)", "M2 IA (CMI)", "M2 SYRIUS (CMI)", "M2 AI4CI (CMI)",
  "D1", "D2", "D3",
] as const;

export const STUDY_LEVEL_VALUES: ReadonlySet<string> = new Set(STUDY_LEVEL_OPTIONS);
