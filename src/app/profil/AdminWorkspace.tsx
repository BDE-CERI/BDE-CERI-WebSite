"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "./actions";
import { markAdminNotificationsRead } from "./notification-actions";
import EditModeToggle from "./EditModeToggle";
import { AdminWorkspaceProvider, useAdminWorkspace, type AdminMessages } from "./AdminUI";

export type WorkspaceSection = { id: string; label: string; description: string; icon: string; count?: number; notifications?: number; group?: string };

type Props = {
  copy: AdminMessages & Record<string, string>;
  sections: WorkspaceSection[];
  activeSection: string;
  member: { first_name: string; last_name: string; photo_url?: string | null; role_label?: string | null };
  accessLabel: string;
  canEditSite: boolean;
  english: boolean;
  dict: Parameters<typeof EditModeToggle>[0]["dict"];
  signOutLabel: string;
  targetMemberId?: string;
  editId?: string;
  children: ReactNode;
};

function SignOutButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 px-3.5 py-2.5 text-xs font-semibold text-on-surface-variant transition hover:bg-error/10 hover:text-error disabled:opacity-50">
    <span aria-hidden="true" className={"material-symbols-outlined text-base " + (pending ? "animate-spin" : "")}>{pending ? "progress_activity" : "logout"}</span>{label}
  </button>;
}

function Workspace({ copy, sections, activeSection, member, accessLabel, canEditSite, english, dict, signOutLabel, targetMemberId, editId, children }: Props) {
  const { dirtyCount, requestDiscard } = useAdminWorkspace();
  const router = useRouter();
  const signOutRef = useRef<HTMLFormElement>(null);
  const bypassSignOut = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousSection = useRef(activeSection);
  const active = sections.find((section) => section.id === activeSection) || sections[0];
  useEffect(() => {
    if (previousSection.current !== activeSection) headingRef.current?.focus({ preventScroll: true });
    previousSection.current = activeSection;
  }, [activeSection]);
  useEffect(() => {
    if (activeSection !== "events" && activeSection !== "news" && activeSection !== "poles" && activeSection !== "account_requests" && activeSection !== "badges") return;
    let active = true;
    void markAdminNotificationsRead(activeSection).then(result => {
      if (active && "success" in result) router.refresh();
    });
    return () => { active = false; };
  }, [activeSection, router]);
  const newLabel = english ? "new" : "nouveau(x)";
  const hrefFor = (id: string) => {
    const params = new URLSearchParams({ section: id });
    if (id === "members" && targetMemberId) params.set("edit_member_id", targetMemberId);
    if (id === "news" && editId) params.set("edit_id", editId);
    return "/profil?" + params.toString();
  };

  return (
    <div className="admin-workspace mx-auto w-full max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-col justify-between gap-5 rounded-3xl border border-outline-variant/20 bg-surface-container-low/70 p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
            <span aria-hidden="true" className="material-symbols-outlined text-2xl">space_dashboard</span>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-tertiary">BDE CERI</p>
            <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface sm:text-2xl">{copy.workspace}</h1>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">{copy.workspace_subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {activeSection !== "members" && <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
              {member.photo_url ? <Image src={member.photo_url} alt="" fill sizes="36px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs font-bold text-tertiary">{member.first_name.charAt(0)}{member.last_name.charAt(0)}</span>}
            </div>
            <div className="min-w-0">
              <p className="max-w-48 truncate text-xs font-semibold">{member.first_name} {member.last_name}</p>
              <p className="mt-0.5 text-[10px] text-on-surface-variant">{accessLabel}</p>
            </div>
          </div>}
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/25 px-3.5 py-2.5 text-xs font-semibold transition hover:bg-surface-container-high">
            <span aria-hidden="true" className="material-symbols-outlined text-base">open_in_new</span>{copy.view_site}
          </Link>
          <form ref={signOutRef} action={signOut} onSubmit={(event) => {
            if (!dirtyCount || bypassSignOut.current) return;
            event.preventDefault();
            requestDiscard(() => { bypassSignOut.current = true; signOutRef.current?.requestSubmit(); });
          }}>
            <SignOutButton label={signOutLabel} />
          </form>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-24">
            <nav aria-label={copy.navigation} className="flex gap-2 overflow-x-auto rounded-2xl border border-outline-variant/15 bg-surface-container-low/60 p-2 lg:flex-col lg:overflow-visible">
              {sections.map((section, index) => (
                <Fragment key={section.id}>
                {section.group && (index === 0 || sections[index - 1].group !== section.group) && <p className="hidden px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[.12em] text-on-surface-variant/60 lg:block">{section.group}</p>}
                <Link href={hrefFor(section.id)} aria-current={section.id === activeSection ? "page" : undefined}
                  className={"group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-semibold transition lg:w-full " + (section.id === activeSection ? "bg-tertiary/10 text-tertiary ring-1 ring-inset ring-tertiary/20" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface")}>
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">{section.icon}</span>
                  <span>{section.label}</span>
                  {section.count !== undefined && <span className="ml-auto rounded-lg bg-surface-container-high/70 px-1.5 py-0.5 text-[10px] tabular-nums">{section.count}</span>}
                  {!!section.notifications && <span title={`${section.notifications} ${newLabel}`} aria-label={`${section.notifications} ${newLabel}`} className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold leading-4 tabular-nums text-on-error shadow-sm">{section.notifications > 99 ? "99+" : section.notifications}</span>}
                </Link>
                </Fragment>
              ))}
            </nav>
            {canEditSite && (
              <div className="hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 p-4 lg:block">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold">{copy.editing_mode}</p>
                  <EditModeToggle dict={dict} />
                </div>
                <p className="text-[11px] leading-5 text-on-surface-variant">{copy.editing_mode_desc}</p>
              </div>
            )}
            {dirtyCount > 0 && <p role="status" className="flex items-center gap-2 rounded-xl border border-tertiary/20 bg-tertiary/5 px-3 py-2.5 text-xs text-on-surface-variant">
              <span aria-hidden="true" className="material-symbols-outlined text-base text-tertiary">edit_note</span>{copy.unsaved_notice}
            </p>}
          </div>
        </aside>

        <section aria-labelledby="admin-section-title" className="min-w-0">
          <div className="mb-6 flex items-start gap-3.5">
            <span aria-hidden="true" className="material-symbols-outlined mt-0.5 text-2xl text-tertiary">{active.icon}</span>
            <div className="min-w-0">
              <h2 id="admin-section-title" ref={headingRef} tabIndex={-1} className="font-headline text-2xl font-bold tracking-tight outline-none sm:text-3xl">{active.label}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{active.description}</p>
            </div>
          </div>
          {canEditSite && <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 p-4 lg:hidden">
            <div><p className="text-xs font-semibold">{copy.editing_mode}</p><p className="mt-1 text-[11px] leading-5 text-on-surface-variant">{copy.editing_mode_desc}</p></div><EditModeToggle dict={dict} />
          </div>}
          {children}
        </section>
      </div>
    </div>
  );
}

export default function AdminWorkspace(props: Props) {
  return <AdminWorkspaceProvider messages={props.copy}><Workspace {...props} /></AdminWorkspaceProvider>;
}
