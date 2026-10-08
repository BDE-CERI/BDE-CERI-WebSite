This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Cookies et statistiques de fréquentation

Le suivi de fréquentation est activé uniquement après consentement. Ajoutez ces variables à votre environnement local et à l’hébergement (ne publiez jamais les valeurs secrètes) :

- SUPABASE_SERVICE_ROLE_KEY : clé service role du projet Supabase, uniquement côté serveur.
- VISITOR_HASH_SECRET : secret aléatoire dédié (au moins 32 octets) utilisé pour produire les empreintes HMAC quotidiennes.
- NEXT_PUBLIC_HELLOASSO_DONATION_URL : lien direct vers le formulaire HelloAsso de don de 1 € (optionnel).

Appliquez ensuite supabase/migrations/202610080001_visitor_analytics.sql au projet Supabase via les migrations du CLI ou l’éditeur SQL. Les statistiques se trouvent dans l’espace membre du bureau restreint.

Les coordonnées de l’éditeur et de l’hébergeur, les informations de conservation et les règles propres aux ventes HelloAsso dans les pages juridiques doivent être vérifiées et complétées avant publication définitive.
