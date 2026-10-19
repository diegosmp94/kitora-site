# Kitora production — droits d'accès LIVE (étape 2)

## Contrôle du mode de facturation
La plateforme reconnaît les **abonnements LIVE existants et vérifiés** dans `kitora_live_subscriptions`. En leur absence seulement, les abonnements TEST dans `subscriptions` gardent un accès démo. Un abonnement LIVE annulé ou en défaut **ne réactive jamais** les droits TEST.

L'accès UI est contrôlé dans `billing-entitlements.js`, `choisir-offre.js`, `tool-access.js`, `advanced-exports.js`, `workspace-insights.js`, `auto-cloud.js`, `plus-lab.js` et `subscriber-requests.js`. **Ces contrôles ne remplacent pas l'application des droits serveur/RLS.**

## Backend
- `generate-plus` et `kitora-ai-worker` doivent être redéployées à partir des sources validées sur la PR pour reconnaître LIVE.
- L'enregistrement cloud Workspace passe par la RPC Postgres `kitora_cloud_save_cas`, mise à niveau via le SQL de `security/kitora-live-workspace-cloud.sql`.
- Les protections existantes restent en place : RLS invoker, contenu 150 Ko max, CAS, lock et protections contre les accès non autorisés.
- Les fonctions IA peuvent rester désactivées via `KITORA_GROQ_ENABLED` ; l'accès utilisateur n'est pas une promesse de génération aboutie.

## Commercialisation
- **Aucun Checkout LIVE activé par cette étape**. Les prix Stripe LIVE, le webhook, le compte marchand, les CGV et le support doivent faire l'objet de tests réels distincts avant ouverture de l'encaissement.
- Les nouveaux achats via la boutique restent en mode TEST. Les offres collectives Impact, Launch, Flow, Creative, Horizon ne doivent pas être vendues comme livrées.
- Les packs individuels Free/Solo/Workspace et les modules des offres Plus/Ultimate existants s'ouvrent en production uniquement selon leurs droits.
- L'environnement LIVE Stripe réel nécessite une vérification explicite du représentant légal/adulte autorisé lorsque le titulaire est mineur.

## Vérification
- `node tests/check-live-entitlements.mjs`
- `node tests/browser-plan-entitlements.mjs` (Chromium)
- Tester un compte LIVE actif, un LIVE suspendu + TEST actif, un compte TEST uniquement et un utilisateur gratuit.
- Contrôler les journaux Supabase, webhook et l'absence de divulgation de données anonymes.

Le mode TEST technique doit rester distinct du mode de paiement LIVE et aucune clé secrète ne doit être exposée sur GitHub Pages.
