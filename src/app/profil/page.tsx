import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import VisitorStats from "@/components/VisitorStats";
import AdminWorkspace, { type WorkspaceSection } from "./AdminWorkspace";
import { EmptyState } from "./AdminUI";
import ProfileEditor, { type MemberProfile } from "./ProfileEditor";
import MemberSwitcher, { type DirectoryMember } from "./MemberSwitcher";
import AssignmentManager from "./AssignmentManager";
import EventManager from "./EventManager";
import NewsManager from "./NewsManager";
import PoleManager from "./PoleManager";
import ShopManager from "./ShopManager";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Espace de travail du BDE", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };
type SectionId = "overview" | "profile" | "members" | "events" | "news" | "poles" | "shop" | "stats";
const boardRoles = ["president", "tresorier", "secretaire", "vp_general"];

function relationName(value: unknown): string {
  if (Array.isArray(value)) return relationName(value[0]);
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") return value.name;
  return "";
}

export default async function ProfilPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, dict, supabase] = await Promise.all([searchParams, getDictionary(), createClient()]);
  const copy = dict.profil.admin;
  const readParam = (name: string) => typeof params[name] === "string" ? params[name] as string : undefined;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await supabase.from("members").select("*").eq("auth_user_id", user.id).maybeSingle();
  let member = current.data as MemberProfile | null;
  let profileError = !!current.error;
  if (!member && !profileError && user.email) {
    const match = await supabase.from("members").select("*").eq("email", user.email).is("auth_user_id", null).maybeSingle();
    if (match.error) profileError = true;
    if (match.data) {
      const linked = await supabase.from("members").update({ auth_user_id: user.id }).eq("id", match.data.id).is("auth_user_id", null).select("*").single();
      member = linked.data as MemberProfile | null;
      profileError = !!linked.error;
    }
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-7 text-center">
          <span aria-hidden="true" className="material-symbols-outlined text-4xl text-tertiary">account_circle</span>
          <h1 className="mt-4 font-headline text-2xl font-bold">{copy.profile_missing}</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{profileError ? copy.data_error : copy.profile_missing_desc}</p>
          <p className="mt-2 break-all text-xs text-on-surface-variant">{user.email}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-tertiary px-4 py-2.5 text-sm font-semibold text-on-tertiary">{dict.header.contact}</Link>
            <form action={signOut}><button type="submit" className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold">{dict.profil.sign_out}</button></form>
          </div>
        </section>
      </div>
    );
  }

  const isBoard = member.category === "bureau_restreint" || boardRoles.includes(member.role || "");
  const [userAssignments, primaryPole] = await Promise.all([
    supabase.from("member_assignments").select("pole_id, poles(name)").eq("member_id", member.id),
    member.pole_id ? supabase.from("poles").select("name").eq("id", member.pole_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const communicationPole = (name: string) => /(?:communication|\bcom\b)/i.test(name);
  const isCommunication = communicationPole(relationName(primaryPole.data)) ||
    userAssignments.data?.some((assignment) => communicationPole(relationName(assignment.poles)));
  const accessError = !isBoard && !isCommunication && !!(primaryPole.error || userAssignments.error);
  const canManageNews = isBoard || !!isCommunication;
  const allowed: SectionId[] = isBoard
    ? ["overview", "profile", "events", "news", "poles", "shop", "members", "stats"]
    : canManageNews ? ["overview", "profile", "news"] : ["profile"];
  const preferred = readParam("section") || readParam("tab") || (readParam("edit_id") ? "news" : readParam("edit_member_id") ? "members" : allowed[0]);
  const activeSection = allowed.includes(preferred as SectionId) ? preferred as SectionId : allowed[0];

  const countRows = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
  const counts = isBoard ? await Promise.all([
    countRows("events"), countRows("news"), countRows("poles"), countRows("products"), countRows("taverne_items"), countRows("members"),
  ]) : canManageNews ? [await countRows("news")] : [];
  const countFor = (section: SectionId): number | undefined => {
    if (!isBoard) return section === "news" && counts[0]?.count !== null ? counts[0]?.count ?? undefined : undefined;
    const indices: Partial<Record<SectionId, number>> = { events: 0, news: 1, poles: 2, members: 5 };
    if (section === "shop") return counts[3]?.count != null && counts[4]?.count != null ? counts[3].count + counts[4].count : undefined;
    const index = indices[section];
    return index !== undefined ? counts[index]?.count ?? undefined : undefined;
  };
  const icons: Record<SectionId, string> = { overview: "space_dashboard", profile: "person", members: "manage_accounts", events: "event", news: "newspaper", poles: "hub", shop: "inventory_2", stats: "monitoring" };
  const sections: WorkspaceSection[] = allowed.map((id) => ({
    id, label: copy[id], description: copy[(id + "_desc") as keyof typeof copy], icon: icons[id], count: countFor(id),
    group: ["overview", "profile"].includes(id) ? copy.group_personal : id === "members" ? copy.group_team : id === "stats" ? copy.group_analytics : copy.group_content,
  }));
  const retryUrl = (section: SectionId) => {
    const retry = new URLSearchParams({ section });
    if (section === "members" && readParam("edit_member_id")) retry.set("edit_member_id", readParam("edit_member_id")!);
    if (section === "news" && readParam("edit_id")) retry.set("edit_id", readParam("edit_id")!);
    return "/profil?" + retry.toString();
  };
  const loadError = (section: SectionId) => (
    <div role="alert" className="rounded-2xl border border-error/20 bg-error/5 p-6">
      <p className="text-sm leading-6 text-on-surface-variant">{copy.data_error}</p>
      <a href={retryUrl(section)} className="mt-4 inline-flex rounded-xl border border-outline-variant/30 px-4 py-2 text-xs font-semibold">{copy.refresh}</a>
    </div>
  );

  let content: ReactNode;
  let targetMemberId: string | undefined;

  if (activeSection === "overview") {
    const managementSections = sections.filter((section) => !["overview", "profile", "stats"].includes(section.id));
    content = (
      <div className="space-y-6">
        <section className="rounded-3xl border border-tertiary/20 bg-gradient-to-br from-tertiary/10 via-surface-container-low to-surface-container-low p-6 sm:p-8">
          <p className="text-xs font-semibold text-tertiary">{copy.welcome.replace("{name}", member.first_name)}</p>
          <h3 className="mt-3 font-headline text-xl font-bold">{copy.personal_area}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">{copy.personal_area_desc}</p>
          <Link href="/profil?section=profile" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-tertiary px-4 py-2.5 text-xs font-bold text-on-tertiary">{copy.profile}<span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span></Link>
        </section>
        <section>
          <h3 className="mb-4 text-sm font-bold">{copy.quick_access}</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {managementSections.map((section) => (
              <Link key={section.id} href={"/profil?section=" + section.id} className="group flex min-w-0 flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 transition hover:border-tertiary/35 hover:bg-surface-container-high">
                <div className="mb-5 flex items-center justify-between"><span aria-hidden="true" className="material-symbols-outlined text-2xl text-tertiary">{section.icon}</span><span className="font-headline text-2xl font-bold tabular-nums">{section.count ?? "—"}</span></div>
                <h4 className="font-semibold">{section.label}</h4><p className="mt-2 flex-1 text-xs leading-5 text-on-surface-variant">{section.description}</p>
                <span className="mt-4 flex items-center justify-between text-xs font-semibold text-tertiary">{copy.open}<span aria-hidden="true" className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  } else if (activeSection === "profile") {
    content = <ProfileEditor english={dict.profil.title === "My Account"} key={member.id} member={member} canManage={isBoard} copy={copy} />;
  } else if (activeSection === "events") {
    const result = await supabase.from("events").select("*").order("date_start", { ascending: false });
    content = result.error ? loadError("events") : <EventManager embedded dict={dict} initialEvents={result.data || []} />;
  } else if (activeSection === "news") {
    const result = await supabase.from("news").select("*").order("published_at", { ascending: false });
    content = result.error ? loadError("news") : <NewsManager embedded dict={dict} news={result.data || []} />;
  } else if (activeSection === "poles") {
    const result = await supabase.from("poles").select("*").order("order_index", { ascending: true });
    content = result.error ? loadError("poles") : <PoleManager embedded dict={dict} poles={result.data || []} />;
  } else if (activeSection === "shop") {
    const [taverne, branding] = await Promise.all([
      supabase.from("taverne_items").select("*").order("order_index", { ascending: true }),
      supabase.from("products").select("*").order("order_index", { ascending: true }),
    ]);
    content = taverne.error || branding.error ? loadError("shop") : <ShopManager dict={dict} taverneItems={taverne.data || []} brandingItems={branding.data || []} />;
  } else if (activeSection === "members") {
    const selectedId = readParam("edit_member_id");
    const [directory, target, poles] = await Promise.all([
      supabase.from("members").select("id, first_name, last_name, role_label, is_visible").order("last_name", { ascending: true }),
      selectedId && selectedId !== member.id ? supabase.from("members").select("*").eq("id", selectedId).maybeSingle() : Promise.resolve({ data: selectedId ? member : null, error: null }),
      supabase.from("poles").select("id, name").order("order_index", { ascending: true }),
    ]);
    const targetMember = target.data as MemberProfile | null;
    targetMemberId = targetMember?.id;
    const assignments = targetMember ? await supabase.from("member_assignments").select("id, pole_id, role, is_vp, poles(name)").eq("member_id", targetMember.id) : null;
    content = directory.error ? loadError("members") : (
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
        <MemberSwitcher allMembers={(directory.data || []) as DirectoryMember[]} currentId={targetMember?.id} copy={copy} />
        <div className="min-w-0 space-y-8">
          {!selectedId ? <EmptyState icon="person_search" title={copy.choose_member} description={copy.choose_member_desc} /> : target.error || !targetMember ? loadError("members") : <>
            <ProfileEditor english={dict.profil.title === "My Account"} key={"profile-" + targetMember.id} member={targetMember} canManage editingOther={targetMember.id !== member.id} copy={copy} />
            {poles.error || assignments?.error ? loadError("members") : <AssignmentManager key={"assignments-" + targetMember.id} memberId={targetMember.id} memberName={targetMember.first_name + " " + targetMember.last_name}
              poles={poles.data || []} assignments={(assignments?.data || []).map((assignment) => ({ ...assignment, poles: relationName(assignment.poles) ? { name: relationName(assignment.poles) } : null }))} dict={dict} />}
          </>}
        </div>
      </div>
    );
  } else {
    content = <VisitorStats english={dict.profil.title === "My Account"} />;
  }

  return (
    <AdminWorkspace copy={copy} sections={sections} activeSection={activeSection} member={member}
      accessLabel={isBoard ? copy.full_access : canManageNews ? copy.news_access : accessError ? copy.access_pending : copy.member_access}
      canEditSite={isBoard} dict={dict} signOutLabel={dict.profil.sign_out} targetMemberId={targetMemberId} editId={readParam("edit_id")}>
      {accessError && <div role="alert" className="mb-6 rounded-2xl border border-error/20 bg-error/5 p-5">
        <p className="text-sm leading-6 text-on-surface-variant">{copy.access_error}</p>
        <a href={retryUrl(activeSection)} className="mt-3 inline-flex rounded-xl border border-outline-variant/30 px-4 py-2 text-xs font-semibold">{copy.refresh}</a>
      </div>}
      {content}
    </AdminWorkspace>
  );
}
