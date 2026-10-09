"use client";

import { addAssignment, deleteAssignment } from "./actions";
import { AdminForm, ConfirmDeleteButton, EmptyState, Field, inputClass } from "./AdminUI";

type Assignment = {
  id: string;
  pole_id: string;
  role: string;
  is_vp: boolean;
  poles?: { name: string } | null;
};

type Props = {
  memberId: string;
  memberName: string;
  poles: { id: string; name: string }[];
  assignments: Assignment[];
  dict: { profil?: { title?: string } };
};

export default function AssignmentManager({ memberId, memberName, poles, assignments, dict }: Props) {
  const en = dict.profil?.title === "My Account";
  const copy = en ? {
    title: "Pole assignments", description: "Organise this member’s responsibilities across the BDE teams.",
    current: "Current assignments", count: "assignment(s)", lead: "Pole vice president", member: "Team member",
    empty: "No additional assignments", emptyDescription: "Add a responsibility to show this member in a pole’s team.",
    add: "Add an assignment", pole: "Pole", choose: "Choose a pole", role: "Responsibility", rolePlaceholder: "For example: Project coordinator",
    roleHint: "This title will appear on the public team and pole pages.", vp: "Vice president of this pole",
    vpHint: "Show this member as the pole’s lead.", notice: "An assignment describes a responsibility within a pole. It does not grant access to the restricted board’s administration tools.",
    submit: "Add assignment", saved: "Assignment added. The public team pages have been updated.",
    allAssigned: "All poles are already assigned", allAssignedDescription: "Remove an existing assignment before replacing it.",
    noPoles: "No poles available", noPolesDescription: "A pole must exist before a member can be assigned to it.",
    remove: "Remove", removeTitle: "Remove this assignment?", removeDescription: "will no longer appear in this pole through this assignment. Their member profile and any primary pole will be kept.",
  } : {
    title: "Affectations aux pôles", description: "Organisez les missions de ce membre dans les équipes du BDE.",
    current: "Affectations actuelles", count: "affectation(s)", lead: "Vice-présidence du pôle", member: "Membre de l’équipe",
    empty: "Aucune affectation supplémentaire", emptyDescription: "Ajoutez une mission pour afficher ce membre dans l’équipe d’un pôle.",
    add: "Ajouter une affectation", pole: "Pôle", choose: "Choisir un pôle", role: "Intitulé de la mission", rolePlaceholder: "Exemple : Responsable des projets",
    roleHint: "Cet intitulé apparaît sur les pages publiques de l’équipe et des pôles.", vp: "Vice-présidence de ce pôle",
    vpHint: "Présenter ce membre comme responsable du pôle.", notice: "Une affectation décrit une mission au sein d’un pôle. Elle ne donne aucun accès aux outils d’administration du bureau restreint.",
    submit: "Ajouter l’affectation", saved: "Affectation ajoutée. Les pages publiques de l’équipe ont été mises à jour.",
    allAssigned: "Tous les pôles sont déjà affectés", allAssignedDescription: "Retirez une affectation existante avant de la remplacer.",
    noPoles: "Aucun pôle disponible", noPolesDescription: "Un pôle doit exister avant de pouvoir y affecter un membre.",
    remove: "Retirer", removeTitle: "Retirer cette affectation ?", removeDescription: "ne figurera plus dans ce pôle via cette affectation. Son profil de membre et son éventuel pôle principal sont conservés.",
  };
  const assignedIds = new Set(assignments.map(assignment => assignment.pole_id));
  const availablePoles = poles.filter(pole => !assignedIds.has(pole.id));

  return (
    <section className="space-y-6">
      <header>
        <h2 className="flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
          <span aria-hidden="true" className="material-symbols-outlined text-tertiary">hub</span>
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy.description}</p>
      </header>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-on-surface">{copy.current}</h3>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">{assignments.length} {copy.count}</span>
          </div>
          {assignments.length === 0 ? (
            <EmptyState icon="group_add" title={copy.empty} description={copy.emptyDescription} />
          ) : (
            <ul className="space-y-3">
              {assignments.map(assignment => {
                const poleName = assignment.poles?.name || poles.find(pole => pole.id === assignment.pole_id)?.name || copy.pole;
                return (
                  <li key={assignment.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <p className="break-words font-semibold text-on-surface">{poleName}</p>
                      <p className="break-words text-sm leading-6 text-on-surface-variant">{assignment.role || copy.member}</p>
                      <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + (assignment.is_vp ? "bg-tertiary/10 text-tertiary" : "bg-surface-container-high text-on-surface-variant")}>
                        {assignment.is_vp ? copy.lead : copy.member}
                      </span>
                    </div>
                    <div className="shrink-0 self-start sm:self-center">
                      <ConfirmDeleteButton action={() => deleteAssignment(assignment.id)} label={copy.remove}
                        title={copy.removeTitle} description={memberName + " — " + poleName + " : " + copy.removeDescription} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="min-w-0 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 sm:p-6">
          <h3 className="mb-5 text-sm font-bold text-on-surface">{copy.add}</h3>
          {availablePoles.length === 0 ? (
            <EmptyState icon="checklist" title={poles.length ? copy.allAssigned : copy.noPoles}
              description={poles.length ? copy.allAssignedDescription : copy.noPolesDescription} />
          ) : (
            <AdminForm action={addAssignment} submitLabel={copy.submit} successMessage={copy.saved} resetOnSuccess>
              <input type="hidden" name="member_id" value={memberId} />
              <Field label={copy.pole} required>
                <select name="pole_id" required defaultValue="" className={inputClass}>
                  <option value="" disabled>{copy.choose}</option>
                  {availablePoles.map(pole => <option key={pole.id} value={pole.id}>{pole.name}</option>)}
                </select>
              </Field>
              <Field label={copy.role} required hint={copy.roleHint}>
                <input name="role" required maxLength={200} placeholder={copy.rolePlaceholder} className={inputClass} />
              </Field>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
                <input type="checkbox" name="is_vp" value="true" className="mt-1 h-4 w-4 shrink-0 accent-tertiary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{copy.vp}</span>
                  <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{copy.vpHint}</span>
                </span>
              </label>
              <p className="flex items-start gap-2 rounded-xl bg-tertiary/5 p-3 text-xs leading-5 text-on-surface-variant">
                <span aria-hidden="true" className="material-symbols-outlined mt-0.5 shrink-0 text-base text-tertiary">info</span>
                {copy.notice}
              </p>
            </AdminForm>
          )}
        </div>
      </div>
    </section>
  );
}
