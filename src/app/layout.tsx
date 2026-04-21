import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getDictionary, getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { EditModeProvider } from "@/context/EditModeContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "BDE CERI - The Nocturnal Invitation",
  description: "Découvrez le site officiel du BDE CERI, l'association étudiante du département informatique de l'université d'Avignon.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dict = await getDictionary();
  const lang = await getLang();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch member info if logged in
  let member = null;
  if (user) {
    const { data } = await supabase
      .from("members")
      .select("first_name, last_name, photo_url, category, role_label")
      .eq("auth_user_id", user.id)
      .single();
    member = data;
  }

  return (
    <html lang={lang} className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-[1024px] flex flex-col selection:bg-tertiary/30 selection:text-tertiary bg-surface text-on-surface">
        <ThemeProvider>
          <EditModeProvider>
            <Header dict={dict} lang={lang} user={user} member={member} />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Footer dict={dict} />
          </EditModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
