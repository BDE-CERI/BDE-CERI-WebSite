import Footer from "@/components/Footer";
import { getDictionary } from "@/locales/dictionaries";

export default async function RootFooter() {
  const dict = await getDictionary();
  return <Footer dict={dict} />;
}
