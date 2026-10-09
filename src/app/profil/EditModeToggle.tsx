"use client";

import { useEditMode } from "@/context/EditModeContext";

export default function EditModeToggle({ dict }: { dict: { profil: { edit_mode: string } } }) {
  const { editMode, toggleEditMode } = useEditMode();
  return (
    <button type="button" role="switch" aria-checked={editMode} aria-label={dict.profil.edit_mode} onClick={toggleEditMode}
      className={"relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary " + (editMode ? "border-tertiary bg-tertiary" : "border-outline-variant/40 bg-surface-container-highest")}>
      <span aria-hidden="true" className={"inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform " + (editMode ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}
