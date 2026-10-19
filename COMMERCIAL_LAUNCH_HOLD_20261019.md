# Kitora — préparation de la commercialisation (19 octobre 2026)

## Décision actuelle

- **Free** : accessible gratuitement en production.
- **Solo (1,99 €/mois indicatifs)** : les outils et exports existent. Les ventes LIVE restent fermées tant que l'identité du vendeur, le droit de contracter, le régime de TVA, les CGV et le parcours client complet n'ont pas été validés.
- **Workspace (3,99 €/mois indicatifs)** : prochainement disponible ; cloud opt-in encore bêta.
- **Plus mensuel (5,99 €/mois) / annuel (59,90 €/an)** : prochainement disponible ; génération IA non garantie tant que le fournisseur et les quotas ne sont pas éprouvés.
- **Ultimate (8,99 €/mois indicatifs)** : prochainement disponible ; englobe des services non encore garantis.
- **Impact, Launch, Flow, Creative, Horizon** : prochainement disponible en B2B ; droits collectifs et fonctionnalités multi-utilisateurs non livrés.
- Tous les **outils Pro individuels** déjà disponibles restent accessibles gratuitement. Les abonnés existants gardent leurs droits selon l'état serveur.

## Conditions avant encaissement réel

1. Publier l'identité exacte de l'exploitant, sa dénomination, ses contacts, immatriculation et informations fiscales nécessaires.
2. Vérifier l'adulte représentant légal responsable auprès de Stripe si le titulaire du compte est mineur ; **ne jamais contourner les exigences d'âge ou de vérification de Stripe**.
3. Finaliser les CGV, les prix TTC/TVA, la médiation de la consommation et les fonctionnalités de rétractation et résiliation en ligne.
4. Mettre en place les tarifs LIVE correspondant à chaque pack autorisé, le webhook LIVE signé, la déduplication et le portail de résiliation.
5. Vérifier de bout en bout un abonnement réel autorisé : Checkout, webhook, droits Supabase, renewal, échec de paiement, annulation, rétractation et remboursement ; **aucun paiement réel ne doit être réalisé sans l'autorisation et le cadre juridique applicables**.
6. Afficher une confirmation claire du prix et de la périodicité avant tout abonnement payant ; conserver Stripe TEST pour les essais techniques.
7. Ne modifier les statuts des packs et les boutons de paiement qu'après résultats et signatures de validation.

## Constat vérifié

Au 19/10/2026, les documents `mentions-legales.html` et `cgv.html` contiennent encore de nombreux champs « À compléter avant commercialisation ». Le produit Plus LIVE dans Stripe possède uniquement deux prix désactivés. Un webhook LIVE est configuré, mais **ni cette configuration ni les tests statiques ne suffisent à autoriser la vente**.

La branche ne crée pas de transaction, n'active aucun tarif LIVE et ne modifie aucun secret.
