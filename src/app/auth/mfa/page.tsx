import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getDictionary } from "@/locales/dictionaries";
import MfaFlow from "./MfaFlow";
export const metadata: Metadata = { title: "Vérification en deux étapes | BDE CERI", robots: { index: false, follow: false } };
type Params = { next?: string };
function safeNext(value: string | undefined) { return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/auth/mfa") ? value : "/profil"; }
export default async function MfaPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [params, supabase, dict] = await Promise.all([searchParams, createClient(), getDictionary()]);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const next = safeNext(params.next);
  const [{ data: assurance }, { data: factors }] = await Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.mfa.listFactors()]);
  const hasVerified = factors?.totp.some(factor => factor.status === "verified");
  if (hasVerified && assurance?.currentLevel === "aal2") redirect(next);
  return <MfaFlow next={next} english={dict.profil.title === "My Account"} />;
}
