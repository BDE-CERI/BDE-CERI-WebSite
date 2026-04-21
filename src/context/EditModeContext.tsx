"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface EditModeContextType {
  editMode: boolean;
  toggleEditMode: () => void;
}

const EditModeContext = createContext<EditModeContextType>({
  editMode: false,
  toggleEditMode: () => {},
});

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("bde_edit_mode");
    if (stored === "true") setEditMode(true);
  }, []);

  const toggleEditMode = () => {
    setEditMode((prev) => {
      const next = !prev;
      sessionStorage.setItem("bde_edit_mode", String(next));
      return next;
    });
  };

  return (
    <EditModeContext.Provider value={{ editMode, toggleEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
}

export const useEditMode = () => useContext(EditModeContext);
