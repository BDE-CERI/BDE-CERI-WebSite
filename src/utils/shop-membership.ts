import { createClient } from "@/utils/supabase/server";
import { normalizeHelloAssoCheckoutUrl } from "@/utils/event-payment";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getShopMembershipAccess(supabase: ServerSupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, memberProfileExists: false, membershipPaid: false };

  const { data: member } = await supabase
    .from("members")
    .select("membership_paid")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return {
    signedIn: true,
    memberProfileExists: Boolean(member),
    membershipPaid: member?.membership_paid === true,
  };
}

export function getMembershipCheckoutUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_MEMBERSHIP_CHECKOUT_URL
    || "https://www.helloasso.com/associations/bde-ceri-avignon/adhesions/adhesion";
  return normalizeHelloAssoCheckoutUrl(configuredUrl);
}
