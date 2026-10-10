"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, inputClass, useAdminWorkspace } from "./AdminUI";
import { getMemberAdminLabel } from "@/utils/member-roles";

export type DirectoryMember = { id: string; first_name: string; last_name: string; role?: string | null; category?: string | null; role_label?: string | null; is_visible?: boolean | null };

export default function MemberSwitcher({ allMembers, currentId, copy, english = false }: {
  allMembers: DirectoryMember[]; currentId?: string; copy: Record<string, string>; english?: boolean;
}) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { requestDiscard } = useAdminWorkspace();
  const normalized = search.trim().toLocaleLowerCase();
  const matches = allMembers.filter((member) => [member.first_name, member.last_name, member.role || "", member.category || "", member.role_label || "", ...Object.values(getMemberAdminLabel(member, english))].join(" ").toLocaleLowerCase().includes(normalized));
  const selectMember = (id: string) => {
    if (id === currentId) return;
    requestDiscard(() => {
      const params = new URLSearchParams({ section: "members" });
      params.set("edit_member_id", id);
      router.push("/profil?" + params.toString());
    });
  };
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-low lg:sticky lg:top-24">
      <div className="space-y-3 border-b border-outline-variant/15 p-4">
        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold">{copy.select_member}</h3><span className="text-[10px] tabular-nums text-on-surface-variant">{allMembers.length}</span></div>
        <label className="block"><span className="sr-only">{copy.search_members}</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.search_members} className={inputClass} /></label>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto p-2 lg:max-h-[65vh]">
        {matches.map((member) => (
          <button key={member.id} type="button" aria-pressed={member.id === currentId} onClick={() => selectMember(member.id)}
            className={"flex w-full items-start gap-2.5 rounded-xl p-3 text-left transition " + (member.id === currentId ? "bg-tertiary/10 ring-1 ring-inset ring-tertiary/25" : "hover:bg-surface-container-high")}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-tertiary">{member.first_name.charAt(0)}{member.last_name.charAt(0)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{member.first_name} {member.last_name}</span><span className="mt-1 block truncate text-[10px] text-on-surface-variant">{getMemberAdminLabel(member, english).primary || copy.member_access}</span>{member.category && <span className="mt-0.5 block truncate text-[9px] uppercase tracking-wide text-on-surface-variant/70">{getMemberAdminLabel(member, english).category}</span>}</span>
            {member.id === currentId && <span aria-hidden="true" className="material-symbols-outlined mt-1 text-base text-tertiary">check_circle</span>}
          </button>
        ))}
        {matches.length === 0 && <EmptyState title={copy.no_members} />}
      </div>
    </section>
  );
}
