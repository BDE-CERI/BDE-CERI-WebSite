import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getDictionary, getLang } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { EditModeProvider } from "@/context/EditModeContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://bdeceri.fr"),
  title: "BDE CERI - L'Élite Étudiante de l'Informatique en Avignon",
  description: "Site officiel du Bureau des Étudiants du CERI (Centre d'Enseignement et de Recherche en Informatique) de l'Université d'Avignon. Événements, vie étudiante, boutique et plus.",
  keywords: ["BDE", "CERI", "Avignon", "Informatique", "Université", "Étudiant", "Asso", "Bureau des Etudiants"],
  authors: [{ name: "BDE CERI" }],
  creator: "BDE CERI",
  openGraph: {
    title: "BDE CERI - Hub Digital",
    description: "Rejoignez l'élite étudiante du CERI en Avignon.",
    url: "https://bdeceri.fr",
    siteName: "BDE CERI",
    images: [
      {
        url: "/logos/requin.png",
        width: 1200,
        height: 630,
        alt: "Logo BDE CERI",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BDE CERI - Hub Digital",
    description: "Rejoignez l'élite étudiante du CERI en Avignon.",
    images: ["/logos/requin.png"],
  },
  icons: {
    icon: "/logos/requin.png",
    apple: "/logos/requin.png",
  },
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
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('SW registered:', reg.scope);
                }).catch(function(err) {
                  console.log('SW registration failed:', err);
                });
              });
            }
          `
        }} />
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
