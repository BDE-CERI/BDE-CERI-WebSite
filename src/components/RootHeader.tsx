import { getDictionary, getLang } from "@/locales/dictionaries";
import { getCurrentUserContext } from "@/utils/supabase/current-user";
import Header from "@/components/Header";

export default async function RootHeader() {
  const [dict, lang, { user, member }] = await Promise.all([
    getDictionary(),
    getLang(),
    getCurrentUserContext(),
  ]);

  return <Header dict={dict} lang={lang} user={user} member={member} />;
}
