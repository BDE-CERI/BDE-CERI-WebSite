import type { Metadata } from "next";
import "./globals.css";
import { EditModeProvider } from "@/context/EditModeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Suspense } from "react";
import RootHeader from "@/components/RootHeader";
import RootFooter from "@/components/RootFooter";
import StructuredData from "@/components/StructuredData";
import CookieConsent from "@/components/CookieConsent";
import MediaPreloadPrompt from "@/components/MediaPreloadPrompt";
import { Manrope, Space_Grotesk } from "next/font/google";
import { getLang } from "@/locales/dictionaries";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://bdeceri.fr"),
  title: {
    default: "BDE CERI Avignon | Vie étudiante, événements et association",
    template: "%s | BDE CERI Avignon",
  },
  description: "Le Bureau des étudiants du CERI à Avignon : événements, vie de campus, eSport, équipe et boutique étudiante.",
  applicationName: "BDE CERI Avignon",
  category: "student association",
  keywords: ["BDE CERI", "BDE Avignon", "association étudiante Avignon", "vie étudiante", "CERI", "Université d'Avignon", "événements étudiants", "eSport étudiant"],
  authors: [{ name: "BDE CERI" }],
  creator: "BDE CERI",
  publisher: "BDE CERI Avignon",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    title: "BDE CERI Avignon | Vie étudiante et événements",
    description: "Événements, eSport, projets associatifs et vie de campus au CERI à Avignon.",
    url: "https://bdeceri.fr",
    siteName: "BDE CERI",
    images: [
      {
        url: "/og-bde-ceri.jpg",
        width: 1200,
        height: 630,
        alt: "BDE CERI Avignon — association étudiante du CERI",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BDE CERI Avignon | Vie étudiante et événements",
    description: "Événements, eSport, projets associatifs et vie de campus au CERI à Avignon.",
    images: ["/og-bde-ceri.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logos/requin-180.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const english = (await getLang()) === "en";
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang = /(?:^|;\\s*)bde_lang=en(?:;|$)/.test(document.cookie) ? 'en' : 'fr';" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator && ${process.env.NODE_ENV === "production"}) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('SW registered:', reg.scope);
                }).catch(function(err) {
                  console.log('SW registration failed:', err);
                });
              });
            } else if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                registrations.forEach(function(registration) {
                  registration.unregister();
                });
              });
            }
          `
        }} />
      </head>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} antialiased min-h-[1024px] flex flex-col selection:bg-tertiary/30 selection:text-tertiary bg-surface text-on-surface`}>
        <ThemeProvider>
          <EditModeProvider>
            <StructuredData />
            <Suspense fallback={<div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-20 border-b border-outline-variant/10 bg-surface/70 backdrop-blur-xl" />}>
              <RootHeader />
            </Suspense>
            <CookieConsent english={english} />
            <MediaPreloadPrompt english={english} />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Suspense fallback={<div aria-hidden="true" className="h-48 bg-surface-container-low" />}>
              <RootFooter />
            </Suspense>
          </EditModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
