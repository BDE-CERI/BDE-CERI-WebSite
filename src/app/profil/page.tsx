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
import MemberBadgeManager from "./MemberBadgeManager";
import { signOut } from "./actions";
import AccountSettings from "./AccountSettings";
import AccountRequests from "./AccountRequests";
import LocalHoursManager from "./LocalHoursManager";
import type { AccountEmailRequest } from "@/types/account-settings";
import { getLocalOfficeData } from "@/utils/local-office";
import { getMemberRoleLabel, hasSiteAdminAccess, isMemberPoleVicePresident, isRestrictedBoardMember } from "@/utils/member-roles";

export const metadata: Metadata = { title: "Espace de travail du BDE", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };
type SectionId = "overview" | "profile" | "settings" | "account_requests" | "members" | "events" | "news" | "poles" | "local" | "badges" | "stats";
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
  // Account linking happens only during explicit password sign-in.
  // A page read, including after Google OAuth, never claims a member record.
  const member = current.data as MemberProfile | null;
  const profileError = !!current.error;

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

  const isBoard = isRestrictedBoardMember(member.category, member.role);
  const isAdmin = hasSiteAdminAccess(member.category, member.role, member.is_dev);
  const isVicePresident = /(?:^vp_|vice|vp)/i.test((member.role || "") + " " + (member.role_label || ""));
  if (isAdmin) {
    const [{ data: assurance }, { data: factors }] = await Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.mfa.listFactors()]);
    const hasVerifiedFactor = factors?.totp.some(factor => factor.status === "verified");
    if (!hasVerifiedFactor || assurance?.currentLevel !== "aal2") {
      const returnTo = "/profil" + (params.section ? "?section=" + encodeURIComponent(String(params.section)) : "");
      redirect("/auth/mfa?next=" + encodeURIComponent(returnTo));
    }
  }
  const [userAssignments, primaryPole] = await Promise.all([
    supabase.from("member_assignments").select("pole_id, is_vp, poles(name)").eq("member_id", member.id),
    member.pole_id ? supabase.from("poles").select("name").eq("id", member.pole_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const isPoleVicePresident = (userAssignments.data?.some(assignment => assignment.is_vp === true) ?? false) || isMemberPoleVicePresident(member.role, member.pole_id);
  const isKeyholder = member.category === "bureau" && member.is_keyholder === true && isPoleVicePresident;
  const canManageLocal = isAdmin || isKeyholder;
  const communicationPole = (name: string) => /(?:communication|\bcom\b)/i.test(name);
  const isCommunication = communicationPole(relationName(primaryPole.data)) ||
    userAssignments.data?.some((assignment) => communicationPole(relationName(assignment.poles)));
  const accessError = !isAdmin && !isCommunication && !!(primaryPole.error || userAssignments.error);
  const canManageNews = isAdmin || !!isCommunication;
  const standardAllowed: SectionId[] = isAdmin
    ? ["overview", "profile", "settings", "events", "news", "poles", "local", "members", "account_requests", "badges", "stats"]
    : canManageNews ? ["overview", "profile", "settings", "news"] : ["profile", "settings"];
  const allowed: SectionId[] = canManageLocal && !standardAllowed.includes("local") ? [...standardAllowed, "local"] : standardAllowed;
  const preferred = readParam("section") || readParam("tab") || (readParam("edit_id") ? "news" : readParam("edit_member_id") ? "members" : allowed[0]);
  const activeSection = allowed.includes(preferred as SectionId) ? preferred as SectionId : allowed[0];

  const countRows = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
  const counts = isAdmin ? await Promise.all([
    countRows("events"), countRows("news"), countRows("poles"), countRows("members"),
    supabase.from("member_email_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending"), countRows("member_badges"),
  ]) : canManageNews ? [await countRows("news")] : [];
  const countFor = (section: SectionId): number | undefined => {
    if (!isAdmin) return section === "news" && counts[0]?.count !== null ? counts[0]?.count ?? undefined : undefined;
    const indices: Partial<Record<SectionId, number>> = { events: 0, news: 1, poles: 2, members: 3, account_requests: 4, badges: 5 };
    const index = indices[section];
    return index !== undefined ? counts[index]?.count ?? undefined : undefined;
  };
  const notificationCounts: Partial<Record<"events" | "news" | "poles" | "account_requests" | "badges", number>> = {};
  if (isAdmin) {
    const { data: receipts } = await supabase.from("admin_notification_reads").select("section, last_read_at").eq("member_id", member.id);
    const lastReadBySection = new Map<string, string>((receipts || []).map(receipt => [receipt.section, receipt.last_read_at] as const));
    const notificationSections = ["events", "news", "poles", "account_requests", "badges"] as const;
    const unread = await Promise.all(notificationSections.map(section => {
      const lastRead = lastReadBySection.get(section) || "1970-01-01T00:00:00.000Z";
      return supabase.from("admin_activity_notifications").select("id", { count: "exact", head: true }).eq("section", section).gt("created_at", lastRead);
    }));
    notificationSections.forEach((section, index) => { notificationCounts[section] = unread[index].error ? 0 : unread[index].count || 0; });
  }
  const icons: Record<SectionId, string> = { overview: "space_dashboard", profile: "person", settings: "settings", account_requests: "fact_check", members: "manage_accounts", events: "event", news: "newspaper", poles: "hub", local: "storefront", badges: "military_tech", stats: "monitoring" };
  const sections: WorkspaceSection[] = allowed.map((id) => ({
    id, label: copy[id], description: copy[(id + "_desc") as keyof typeof copy], icon: icons[id], count: countFor(id),
    notifications: id === "events" || id === "news" || id === "poles" || id === "account_requests" || id === "badges" ? notificationCounts[id] : undefined,
    group: ["overview", "profile", "settings"].includes(id) ? copy.group_personal : ["members", "account_requests", "badges"].includes(id) ? copy.group_team : id === "stats" ? copy.group_analytics : copy.group_content,
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
    const managementSections = sections.filter((section) => !["overview", "profile", "settings", "stats"].includes(section.id));
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
                <div className="mb-5 flex items-center justify-between"><span aria-hidden="true" className="material-symbols-outlined text-2xl text-tertiary">{section.icon}</span><div className="flex items-center gap-2">{!!section.notifications && <span title={`${section.notifications} ${dict.profil.title === "My Account" ? "new" : "nouveau(x)"}`} aria-label={`${section.notifications} ${dict.profil.title === "My Account" ? "new" : "nouveau(x)"}`} className="rounded-full bg-error px-2 py-1 text-[10px] font-bold tabular-nums text-on-error shadow-sm">{section.notifications > 99 ? "99+" : section.notifications}</span>}<span className="font-headline text-2xl font-bold tabular-nums">{section.count ?? "—"}</span></div></div>
                <h4 className="font-semibold">{section.label}</h4><p className="mt-2 flex-1 text-xs leading-5 text-on-surface-variant">{section.description}</p>
                <span className="mt-4 flex items-center justify-between text-xs font-semibold text-tertiary">{copy.open}<span aria-hidden="true" className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  } else if (activeSection === "profile") {
    content = <ProfileEditor english={dict.profil.title === "My Account"} key={member.id} member={member} canManage={isAdmin} showKeyholderStatus={isBoard} forceKeyholder={isBoard} isPoleVicePresident={isPoleVicePresident} copy={copy} />;
  } else if (activeSection === "settings") {
    const requests = await supabase.from("member_email_change_requests")
      .select("id, member_id, requested_by, current_email, requested_email, reason, status, created_at, reviewed_at, review_response")
      .eq("requested_by", user.id).order("created_at", { ascending: false }).limit(50);
    const googleIdentity = user.identities?.find((identity) => identity.provider === "google");
    content = <AccountSettings english={dict.profil.title === "My Account"} email={user.email || member.email || ""}
      googleLinked={!!googleIdentity} googleEmail={typeof googleIdentity?.identity_data?.email === "string" ? googleIdentity.identity_data.email : undefined}
      requests={(requests.data || []) as AccountEmailRequest[]} requestsUnavailable={!!requests.error}
      googleStatus={readParam("google_status")} googleError={readParam("google_error")}
      mfaRequired={isAdmin} mfaRecommended={!isAdmin && isVicePresident} />;
  } else if (activeSection === "account_requests") {
    const selection = "id, member_id, requested_by, current_email, requested_email, reason, status, created_at, reviewed_at, review_response, requester:members(first_name, last_name)";
    const [pending, history] = await Promise.all([
      supabase.from("member_email_change_requests").select(selection).eq("status", "pending").order("created_at", { ascending: true }),
      supabase.from("member_email_change_requests").select(selection).in("status", ["resolved", "rejected"]).order("reviewed_at", { ascending: false }).limit(50),
    ]);
    content = pending.error || history.error ? loadError("account_requests") : <AccountRequests english={dict.profil.title === "My Account"}
      requests={[...(pending.data || []), ...(history.data || [])].map(({ requester, ...request }) => {
        const identity = Array.isArray(requester) ? requester[0] : requester;
        return { ...request, requester_name: identity ? [identity.first_name, identity.last_name].filter(Boolean).join(" ") : undefined };
      }) as AccountEmailRequest[]} />;
  } else if (activeSection === "events") {
    const result = await supabase.from("events").select("*").order("date_start", { ascending: false });
    content = result.error ? loadError("events") : <EventManager embedded dict={dict} initialEvents={result.data || []} />;
  } else if (activeSection === "news") {
    const [result, authorDirectory] = await Promise.all([
      supabase.from("news").select("*, author:members(first_name, last_name)").order("published_at", { ascending: false }),
      supabase.from("members").select("id, first_name, last_name, role_label, category")
        .in("category", ["bureau_restreint", "bureau"]).order("last_name", { ascending: true }).order("first_name", { ascending: true }),
    ]);
    content = result.error || authorDirectory.error ? loadError("news") : <NewsManager embedded dict={dict}
      news={(result.data || []).map(item => ({ ...item, author: Array.isArray(item.author) ? item.author[0] ?? null : item.author ?? null }))}
      authors={authorDirectory.data || []} currentMemberId={member.id} />;
  } else if (activeSection === "poles") {
    const result = await supabase.from("poles").select("*").order("order_index", { ascending: true });
    content = result.error ? loadError("poles") : <PoleManager embedded dict={dict} poles={result.data || []} />;
  } else if (activeSection === "badges") {
    const [directory, result] = await Promise.all([
      supabase.from("members").select("id, first_name, last_name").order("last_name", { ascending: true }).order("first_name", { ascending: true }),
      supabase.from("member_badges").select("id, member_id, event_name, award, team_name, academic_year, member:members(first_name, last_name)").order("academic_year", { ascending: false }).order("created_at", { ascending: false }),
    ]);
    const badgeRows = (result.data || []).map(row => {
      const item = Array.isArray(row.member) ? row.member[0] : row.member;
      return { id: row.id, member_id: row.member_id, event_name: row.event_name, award: row.award, team_name: row.team_name, academic_year: row.academic_year, member_name: item ? [item.first_name, item.last_name].filter(Boolean).join(" ") : "Membre inconnu" };
    });
    content = directory.error || result.error ? loadError("badges") : <MemberBadgeManager members={directory.data || []} badges={badgeRows} english={dict.profil.title === "My Account"} />;
  } else if (activeSection === "local") {
    const [localData, directory, vicePresidentAssignments] = await Promise.all([
      getLocalOfficeData(),
      supabase.from("members").select("id, first_name, last_name, category, role, pole_id").eq("is_keyholder", true).order("last_name").order("first_name"),
      supabase.from("member_assignments").select("member_id").eq("is_vp", true),
    ]);
    const vicePresidentIds = new Set((vicePresidentAssignments.data || []).map(assignment => assignment.member_id));
    const eligibleKeyholders = (directory.data || []).filter(person => isRestrictedBoardMember(person.category, person.role) || (person.category === "bureau" && (vicePresidentIds.has(person.id) || isMemberPoleVicePresident(person.role, person.pole_id))));
    content = directory.error || vicePresidentAssignments.error ? loadError("local") : <LocalHoursManager data={localData} keyholders={eligibleKeyholders.map(person => ({ id: person.id, first_name: person.first_name, last_name: person.last_name }))} english={dict.profil.title === "My Account"} />;
  } else if (activeSection === "members") {
    const selectedId = readParam("edit_member_id");
    const [directory, target, poles, poleVpRows, primaryVpRows] = await Promise.all([
      supabase.from("members").select("id, first_name, last_name, role, category, role_label, is_visible").order("last_name", { ascending: true }),
      selectedId && selectedId !== member.id ? supabase.from("members").select("*").eq("id", selectedId).maybeSingle() : Promise.resolve({ data: selectedId ? member : null, error: null }),
      supabase.from("poles").select("id, name").order("order_index", { ascending: true }),
      supabase.from("member_assignments").select("pole_id, member_id, members(first_name, last_name)").eq("is_vp", true).not("pole_id", "is", null),
      supabase.from("members").select("id, first_name, last_name, pole_id").eq("role", "vice_president_pole").not("pole_id", "is", null),
    ]);
    const targetMember = target.data as MemberProfile | null;
    targetMemberId = targetMember?.id;
    const assignments = targetMember ? await supabase.from("member_assignments").select("id, pole_id, role, role_label, is_vp, poles(name), created_at").eq("member_id", targetMember.id).order("created_at", { ascending: true }) : null;
    const primaryPole = targetMember?.pole_id ? poles.data?.find(pole => pole.id === targetMember.pole_id) : undefined;
    const primaryAssignment = targetMember && targetMember.category !== "bureau_restreint" && targetMember.pole_id && primaryPole && targetMember.role
      ? { pole_id: targetMember.pole_id, pole_name: primaryPole.name, role: isMemberPoleVicePresident(targetMember.role, targetMember.pole_id) ? `${dict.profil.title === "My Account" ? "Pole Vice President" : "Vice-Président"} ${primaryPole.name}` : getMemberRoleLabel(targetMember.role, dict.profil.title === "My Account"), is_vp: isMemberPoleVicePresident(targetMember.role, targetMember.pole_id) }
      : null;
    const assignmentVicePresidents = (poleVpRows.data || []).map(row => {
      const relation = Array.isArray(row.members) ? row.members[0] : row.members;
      return { pole_id: row.pole_id!, member_id: row.member_id, member_name: relation ? [relation.first_name, relation.last_name].filter(Boolean).join(" ") : "Membre" };
    });
    const poleVicePresidents = [...assignmentVicePresidents, ...(primaryVpRows.data || []).map(row => ({ pole_id: row.pole_id!, member_id: row.id, member_name: [row.first_name, row.last_name].filter(Boolean).join(" ") }))];
    content = directory.error || poleVpRows.error || primaryVpRows.error ? loadError("members") : (
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
        <MemberSwitcher allMembers={(directory.data || []) as DirectoryMember[]} currentId={targetMember?.id} copy={copy} english={dict.profil.title === "My Account"} />
        <div className="min-w-0 space-y-8">
          {!selectedId ? <EmptyState icon="person_search" title={copy.choose_member} description={copy.choose_member_desc} /> : target.error || !targetMember ? loadError("members") : assignments?.error ? loadError("members") : <>
            <ProfileEditor english={dict.profil.title === "My Account"} key={"profile-" + targetMember.id} member={targetMember} canManage showMembershipStatus forceKeyholder={isRestrictedBoardMember(targetMember.category, targetMember.role)} isPoleVicePresident={(assignments?.data?.some(assignment => assignment.is_vp === true) ?? false) || isMemberPoleVicePresident(targetMember.role, targetMember.pole_id)} editingOther={targetMember.id !== member.id} copy={copy} />
            {poles.error ? loadError("members") : <AssignmentManager key={"assignments-" + targetMember.id} memberId={targetMember.id} memberName={targetMember.first_name + " " + targetMember.last_name}
              poles={poles.data || []} assignments={(assignments?.data || []).map((assignment) => ({ ...assignment, poles: relationName(assignment.poles) ? { name: relationName(assignment.poles) } : null }))} primaryAssignment={primaryAssignment}
              initialRoleDescription={targetMember.role_description || ""} poleVicePresidents={poleVicePresidents} dict={dict} />}
          </>}
        </div>
      </div>
    );
  } else {
    content = <VisitorStats english={dict.profil.title === "My Account"} />;
  }

  return (
    <AdminWorkspace copy={copy} sections={sections} activeSection={activeSection} member={member}
      accessLabel={isAdmin ? copy.full_access : canManageNews ? copy.news_access : accessError ? copy.access_pending : copy.member_access}
      canEditSite={isAdmin} english={dict.profil.title === "My Account"} dict={dict} signOutLabel={dict.profil.sign_out} targetMemberId={targetMemberId} editId={readParam("edit_id")}>
      {accessError && <div role="alert" className="mb-6 rounded-2xl border border-error/20 bg-error/5 p-5">
        <p className="text-sm leading-6 text-on-surface-variant">{copy.access_error}</p>
        <a href={retryUrl(activeSection)} className="mt-3 inline-flex rounded-xl border border-outline-variant/30 px-4 py-2 text-xs font-semibold">{copy.refresh}</a>
      </div>}
      {content}
    </AdminWorkspace>
  );
}
