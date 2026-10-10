import { getLang } from "@/locales/dictionaries";
import { getLocalOfficeData } from "@/utils/local-office";
import LocalStatusWidget from "./LocalStatusWidget";

export default async function LocalStatusWidgetServer() {
  const [data, lang] = await Promise.all([getLocalOfficeData(), getLang()]);
  return <LocalStatusWidget data={data} english={lang === "en"} initialTime={new Date().toISOString()} />;
}
