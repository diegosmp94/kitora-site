# Réconciliation des branches Kitora — 19 octobre 2026

## Historique
La branche `release/kitora-v1-ready-20261018` s'était séparée de `main` avec 29 commits propres à release et 25 à main (avant synchronisation). Les branches de sauvegarde ont été créées :

- `backup/kitora-main-pre-release-sync-20261019` (commit `45d1cf222171e0148e6986793d5c2233ea9592ca`)
- `backup/kitora-release-pre-sync-20261019` (commit `5018a5821b551ff23435c43068435c48fa02570b`)

## Choix de résolution
Fusion des **deux historiques** (sans `git reset` ni `push --force`) et conservation de la version plus récente de `main` pour les pages et scripts déjà modifiés dans les deux branches :
`aide.html`, `cart.js`, `compte.html`, `experience-2-home.css`, `panier.html`, `subscriber-requests.js`.

Cela évite notamment de remplacer l'accueil et l'espace client récents, les protections des données ou le parcours Stripe TEST. Les anciennes variantes demeurent consultables dans l'historique Git de release.

Les documents d'audit, de recette et de préparation LIVE propres à release sont retenus **comme documents historiques**. La source `supabase/functions/admin-users/index.ts` de release, contenant une action privilégiée de réinitialisation non déployée et non validée, n'est pas promue en `main` : elle reste accessible dans la branche de sauvegarde. Aucun déploiement Supabase n'a été fait lors de cette opération.

Les scripts de validation JS et de sécurité checkout de release sont conservés ; le garde-fou checkout a été **réadapté au site réel**, où le paiement public est exclusivement Stripe TEST. La CI s'applique désormais aussi aux pushes `release/**`.

## Interdictions maintenues
- Stripe LIVE et prix réels non activés.
- Pas de clés secrètes dans les scripts publics.
- Aucun écrasement de l'historique des deux branches.
- Ne fusionner la PR de réconciliation qu'une fois les contrôles GitHub réussis.

## Contrôles finaux
Comparer `main...release/kitora-v1-ready-20261018` : le résultat attendu après la fusion et l'avance rapide finale est `ahead_by=0`, `behind_by=0`. Vérifier GitHub Pages et les workflows de `main`.
