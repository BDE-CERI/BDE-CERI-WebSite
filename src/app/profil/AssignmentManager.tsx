"use client";

import { useMemo, useState } from "react";
import { addAssignment, deleteAssignment, updateAssignment } from "./actions";
import { AdminForm, ConfirmDeleteButton, EmptyState, Field, inputClass } from "./AdminUI";

type Assignment = {
  id: string;
  pole_id: string;
  role: string;
  role_label?: string | null;
  is_vp: boolean;
  poles?: { name: string } | null;
  primary?: boolean;
};

type Props = {
  memberId: string;
  memberName: string;
  poles: { id: string; name: string }[];
  assignments: Assignment[];
  primaryAssignment?: { pole_id: string; pole_name: string; role: string; is_vp: boolean } | null;
  initialRoleDescription: string;
  poleVicePresidents: { pole_id: string; member_id: string; member_name: string }[];
  dict: { profil?: { title?: string } };
};

export default function AssignmentManager({ memberId, memberName, poles, assignments, primaryAssignment, initialRoleDescription, poleVicePresidents, dict }: Props) {
  const [selectedPoleId, setSelectedPoleId] = useState("");
  const [isVp, setIsVp] = useState(false);
  const [missionTitle, setMissionTitle] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [roleLabelEdited, setRoleLabelEdited] = useState(false);
  const [roleDescription, setRoleDescription] = useState(initialRoleDescription);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const en = dict.profil?.title === "My Account";
  const copy = en ? {
    title: "Pole assignments", description: "Organise this member’s responsibilities across the BDE teams.",
    current: "Current assignments", count: "assignment(s)", lead: "Pole vice president", member: "Team member",
    empty: "No additional assignments", emptyDescription: "Add a responsibility to show this member in a pole’s team.",
    add: "Add an assignment", editTitle: "Edit an assignment", pole: "Pole", choose: "Choose a pole", role: "Responsibility", rolePlaceholder: "For example: Project coordinator",
    roleHint: "This title will appear on the public team and pole pages.", vp: "Vice president of this pole",
    roleLabel: "Public role label", roleLabelHint: "Shown on this member’s public profile.", roleDescription: "Short role description", roleDescriptionHint: "Up to 1,000 characters; shown on the public profile.",
    edit: "Edit", saveEdit: "Edit assignment", editSaved: "Assignment updated.", cancelEdit: "Cancel", editing: "Editing",
    vpHint: "Show this member as the pole’s lead.", vpExists: "This pole already has a vice president:", roleDisabledHint: "A separate responsibility title is not needed for a pole vice president.", notice: "An assignment describes a responsibility within a pole. It does not grant access to the restricted board’s administration tools.",
    submit: "Add assignment", saved: "Assignment added. The public team pages have been updated.",
    allAssigned: "All poles are already assigned", allAssignedDescription: "Remove an existing assignment before adding another.",
    noPoles: "No poles available", noPolesDescription: "A pole must exist before a member can be assigned to it.",
    remove: "Remove", removeTitle: "Remove this assignment?", removeDescription: "will no longer appear in this pole through this assignment. Their member profile and any primary pole will be kept.", poleLocked: "The pole cannot be changed while editing an assignment.",
  } : {
    title: "Affectations aux pôles", description: "Organisez les missions de ce membre dans les équipes du BDE.",
    current: "Affectations actuelles", count: "affectation(s)", lead: "Vice-présidence du pôle", member: "Membre de l’équipe",
    empty: "Aucune affectation supplémentaire", emptyDescription: "Ajoutez une mission pour afficher ce membre dans l’équipe d’un pôle.",
    add: "Ajouter une affectation", editTitle: "Modifier une affectation", pole: "Pôle", choose: "Choisir un pôle", role: "Intitulé de la mission", rolePlaceholder: "Exemple : Responsable des projets",
    roleHint: "Cet intitulé apparaît sur les pages publiques de l’équipe et des pôles.", vp: "Vice-présidence de ce pôle",
    roleLabel: "Libellé du rôle public", roleLabelHint: "Affiché sur le profil public de ce membre.", roleDescription: "Description courte du rôle", roleDescriptionHint: "1 000 caractères maximum ; affichée sur le profil public.",
    edit: "Modifier", saveEdit: "Modifier l’affectation", editSaved: "Affectation modifiée.", cancelEdit: "Annuler", editing: "Modification en cours",
    vpHint: "Présenter ce membre comme responsable du pôle.", vpExists: "Ce pôle a déjà un vice-président :", roleDisabledHint: "Un intitulé de mission distinct n’est pas nécessaire pour un vice-président de pôle.", notice: "Une affectation décrit une mission au sein d’un pôle. Elle ne donne aucun accès aux outils d’administration du bureau restreint.",
    submit: "Ajouter l’affectation", saved: "Affectation ajoutée. Les pages publiques de l’équipe ont été mises à jour.",
    allAssigned: "Tous les pôles sont déjà affectés", allAssignedDescription: "Retirez une affectation existante avant d’en ajouter une autre.",
    noPoles: "Aucun pôle disponible", noPolesDescription: "Un pôle doit exister avant de pouvoir y affecter un membre.",
    remove: "Retirer", removeTitle: "Retirer cette affectation ?", removeDescription: "ne figurera plus dans ce pôle via cette affectation. Son profil de membre et son éventuel pôle principal sont conservés.", poleLocked: "Le pôle ne peut pas être changé pendant la modification d’une affectation.",
  };
  const showPrimaryAssignment = !!primaryAssignment && !assignments.some(assignment => assignment.pole_id === primaryAssignment.pole_id);
  const currentAssignments: Assignment[] = [
    ...(showPrimaryAssignment && primaryAssignment ? [{
      id: "primary-" + memberId,
      pole_id: primaryAssignment.pole_id,
      role: primaryAssignment.role,
      is_vp: primaryAssignment.is_vp,
      poles: { name: primaryAssignment.pole_name },
      primary: true,
    }] : []),
    ...assignments,
  ];
  const assignedIds = new Set([...assignments.map(assignment => assignment.pole_id), ...(primaryAssignment ? [primaryAssignment.pole_id] : [])]);
  const availablePoles = poles.filter(pole => !assignedIds.has(pole.id));
  const editingAssignment = assignments.find(assignment => assignment.id === editingAssignmentId) || null;
  const existingVicePresident = useMemo(() => poleVicePresidents.find(item => item.pole_id === selectedPoleId && item.member_id !== memberId), [poleVicePresidents, selectedPoleId, memberId]);
  const selectedPoleName = poles.find(pole => pole.id === selectedPoleId)?.name || "";
  const suggestedRoleLabel = isVp
    ? `${en ? "Pole Vice President" : "Vice-Président"}${selectedPoleName ? ` ${selectedPoleName}` : ""}`
    : missionTitle.trim().slice(0, 120);
  const resetForm = () => {
    setEditingAssignmentId(null);
    setSelectedPoleId("");
    setIsVp(false);
    setMissionTitle("");
    setRoleLabel("");
    setRoleLabelEdited(false);
    setRoleDescription(initialRoleDescription);
  };
  const startEditing = (assignment: Assignment) => {
    setEditingAssignmentId(assignment.id);
    setSelectedPoleId(assignment.pole_id);
    setIsVp(assignment.is_vp);
    setMissionTitle(assignment.role || "");
    setRoleLabel(assignment.role_label || assignment.role || "");
    setRoleLabelEdited(true);
    setRoleDescription(initialRoleDescription);
  };
  const cancelEditing = () => resetForm();
  const sortedAssignments = [...currentAssignments].sort((a, b) => Number(b.is_vp) - Number(a.is_vp));

  return (
    <section className="space-y-6">
      <header>
        <h2 className="flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
          <span aria-hidden="true" className="material-symbols-outlined text-tertiary">hub</span>
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy.description}</p>
      </header>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-on-surface">{copy.current}</h3>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">{currentAssignments.length} {copy.count}</span>
          </div>
          {currentAssignments.length === 0 ? (
            <EmptyState icon="group_add" title={copy.empty} description={copy.emptyDescription} />
          ) : (
            <ul className="space-y-3">
              {sortedAssignments.map(assignment => {
                const poleName = assignment.poles?.name || poles.find(pole => pole.id === assignment.pole_id)?.name || copy.pole;
                const isEditing = editingAssignmentId === assignment.id;
                return (
                  <li key={assignment.id} className={"flex min-w-0 flex-col gap-3 rounded-2xl border p-4 transition-colors " + (isEditing ? "border-tertiary/40 bg-tertiary/5" : "border-outline-variant/20 bg-surface-container-low")}>
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="break-words font-semibold text-on-surface">{poleName}</p>
                        <p className="break-words text-sm leading-6 text-on-surface-variant">{assignment.role_label || assignment.role || copy.member}</p>
                        {assignment.primary && <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{en ? "Primary role" : "Rôle principal"}</span>}
                        <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + (assignment.is_vp ? "bg-tertiary/10 text-tertiary" : "bg-surface-container-high text-on-surface-variant")}>
                          {assignment.is_vp ? copy.lead : copy.member}
                        </span>
                      </div>
                      {!assignment.primary && <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-center">
                        <button type="button" disabled={!!editingAssignmentId} onClick={() => startEditing(assignment)}
                          aria-label={copy.edit + " — " + poleName} aria-pressed={isEditing}
                          className={"inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 " + (isEditing ? "border-tertiary/40 bg-tertiary/10 text-tertiary" : "border-outline-variant/30 text-on-surface hover:border-tertiary/40 hover:text-tertiary")}>
                          <span aria-hidden="true" className="material-symbols-outlined text-base">{isEditing ? "edit_note" : "edit"}</span>{isEditing ? copy.editing : copy.edit}
                        </button>
                        <ConfirmDeleteButton action={() => deleteAssignment(assignment.id)} label={copy.remove}
                          title={copy.removeTitle} description={memberName + " — " + poleName + " : " + copy.removeDescription}
                          onSuccess={() => { if (isEditing) cancelEditing(); }} />
                      </div>}
                    </div>
                    {isEditing && <p className="border-t border-tertiary/15 pt-3 text-xs leading-5 text-on-surface-variant">{copy.poleLocked}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-on-surface">
            <span aria-hidden="true" className="material-symbols-outlined text-tertiary">{editingAssignment ? "edit_note" : "add_circle"}</span>
            {editingAssignment ? copy.editTitle : copy.add}
          </h3>
          {poles.length === 0 ? (
            <EmptyState icon="checklist" title={copy.noPoles} description={copy.noPolesDescription} />
          ) : !editingAssignment && availablePoles.length === 0 ? (
            <EmptyState icon="checklist" title={copy.allAssigned} description={copy.allAssignedDescription} />
          ) : (
            <AdminForm
              key={editingAssignment?.id || "new-assignment"}
              action={editingAssignment ? updateAssignment : addAssignment}
              submitLabel={editingAssignment ? copy.saveEdit : copy.submit}
              successMessage={editingAssignment ? copy.editSaved : copy.saved}
              onCancel={editingAssignment ? cancelEditing : undefined}
              onSuccess={resetForm}
              resetOnSuccess={!editingAssignment}
            >
              <input type="hidden" name="member_id" value={memberId} />
              {editingAssignment && <input type="hidden" name="id" value={editingAssignment.id} />}
              <Field label={copy.pole} required={!editingAssignment} hint={editingAssignment ? copy.poleLocked : undefined}>
                <select name={editingAssignment ? undefined : "pole_id"} required={!editingAssignment} disabled={!!editingAssignment}
                  value={selectedPoleId} onChange={event => { setSelectedPoleId(event.target.value); setIsVp(false); }} className={inputClass}>
                  <option value="" disabled>{copy.choose}</option>
                  {poles.filter(pole => editingAssignment ? pole.id === editingAssignment.pole_id : availablePoles.some(available => available.id === pole.id)).map(pole => <option key={pole.id} value={pole.id}>{pole.name}</option>)}
                </select>
              </Field>
              <Field label={copy.role} required={!isVp} hint={isVp ? copy.roleDisabledHint : copy.roleHint}>
                <input name="role" value={missionTitle} onChange={event => { setMissionTitle(event.target.value); if (!roleLabelEdited && !isVp) setRoleLabel(event.target.value); }} required={!isVp} disabled={isVp} maxLength={200} placeholder={copy.rolePlaceholder} className={inputClass + (isVp ? " bg-surface-container-high text-on-surface-variant" : "")} />
              </Field>
              <Field label={copy.roleLabel} required hint={copy.roleLabelHint}>
                <input name="role_label" value={roleLabelEdited ? roleLabel : suggestedRoleLabel} required maxLength={120} onChange={event => { setRoleLabel(event.target.value); setRoleLabelEdited(true); }} className={inputClass} />
              </Field>
              <Field label={copy.roleDescription} hint={copy.roleDescriptionHint}>
                <textarea name="role_description" value={roleDescription} maxLength={1000} rows={3} onChange={event => setRoleDescription(event.target.value)} className={inputClass + " resize-y"} />
              </Field>
              <label className={"flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4 " + (existingVicePresident && !isVp ? "cursor-not-allowed opacity-65" : "cursor-pointer")}>
                <input type="checkbox" name="is_vp" value="true" checked={isVp} disabled={!selectedPoleId || (!!existingVicePresident && !isVp)} onChange={event => { setIsVp(event.target.checked); if (!roleLabelEdited) setRoleLabel(""); }} className="mt-1 h-4 w-4 shrink-0 accent-tertiary disabled:cursor-not-allowed" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{copy.vp}</span>
                  <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{existingVicePresident && !isVp ? `${copy.vpExists} ${existingVicePresident.member_name}` : copy.vpHint}</span>
                </span>
              </label>
              {!editingAssignment && <p className="flex items-start gap-2 rounded-xl bg-tertiary/5 p-3 text-xs leading-5 text-on-surface-variant">
                <span aria-hidden="true" className="material-symbols-outlined mt-0.5 shrink-0 text-base text-tertiary">info</span>
                {en ? "An assignment describes a responsibility within a pole. It does not grant access to the restricted board’s administration tools." : "Une affectation décrit une mission au sein d’un pôle. Elle ne donne aucun accès aux outils d’administration du bureau restreint."}
              </p>}
            </AdminForm>
          )}
        </div>
      </div>
    </section>
  );
}
