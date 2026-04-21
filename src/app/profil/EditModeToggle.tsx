"use client";

import { useEditMode } from "@/context/EditModeContext";

export default function EditModeToggle({ dict }: { dict: any }) {
  const { editMode, toggleEditMode } = useEditMode();

  return (
    <button
      onClick={toggleEditMode}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        editMode ? "bg-primary" : "bg-surface-container-highest"
      }`}
    >
      <span className="sr-only">{dict.profil.edit_mode}</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          editMode ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
