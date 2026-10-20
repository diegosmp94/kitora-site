# Kitora P3 — Finalisation et recette transversale

Date de lancement : 2026-10-20. Branche : `feature/p2-foundations-20261020`. Une seule fusion dans `main` après recette complète.

## Légende
- VERT : implémenté et vérifié par les contrôles concernés.
- ORANGE : travail engagé, validation incomplète.
- ROUGE : non commencé ou bloqué.

## Travaux en cours (orange)

### Analytics réels de plateforme
- [x] Simulateur local de conversion et revenu, avec test Chromium.
- [ ] Définir un schéma d'événements sans données personnelles : affichage d'offre, début checkout TEST, résultat checkout TEST, activation abonnement.
- [ ] Implémenter la collecte côté serveur avec contrôle d'accès et consentement applicable, sans clés secrètes dans le client.
- [x] Tableau de bord agrégé réservé aux administrateurs pour les commandes TEST, abonnements actifs et accès bibliothèque existants ; aucune métrique fictive.\n- [ ] Tableau de bord de trafic/conversion après instrumentation réelle et validation de la confidentialité.
- [ ] Vérifier la confidentialité, les politiques RLS, la rétention et les parcours opt-out si nécessaires.

### Espace organisations B2B
- [x] Table `kitora_organizations` créée dans Supabase avec RLS propriétaire (SELECT, INSERT, UPDATE, DELETE), sans accès SELECT anonyme.
- [x] Page `organisation-pro.html` : création et liste des organisations liées au compte, sans abonnement activé.
- [x] Scénarios Chromium simulés : visiteur non connecté, propriétaire, insertion refusée avec erreur publique générique.
- [ ] Vérifier les accès croisés entre deux comptes réels distincts et les politiques RLS de bout en bout.
- [ ] Gestion des membres, invitations, rôles et permissions d'équipe.
- [ ] Souscriptions B2B, droits serveur et facturation Stripe TEST, puis recette complète.

### Recette globale lots 1, 2 et 3
- [x] Neuf workflows réussis sur le commit précédent `e57f0a9` ; nouvelle recette sur `3d0c26d` : navigateur validé, autres workflows à confirmer avant clôture.
- [x] Studio invité et authentifié avec Supabase simulé ; facture et simulateur testés sous Chromium.
- [ ] Test de bout en bout sur un environnement de préproduction isolé avec Supabase réel et comptes de test dédiés.
- [ ] Test Stripe TEST : choix mensuel/annuel, checkout, webhook signé, activation et révocation des droits, renouvellement, annulation, erreurs.
- [x] Test Chromium des routes marketplace et des catégories, des tarifs mensuel/annuel et du blocage des checkouts non disponibles (UI uniquement). 
- [ ] Test du catalogue/marketplace : disponibilité réelle, panier, paiement TEST et livraison numérique uniquement si implémentés.
- [ ] Test des rôles administrateur avec comptes dédiés et vérification RLS côté serveur.
- [ ] Contrôle accessibilité, mobile, navigation, performances, mentions légales et politiques de données.
- [ ] Revue de la PR #68 et fusion unique après tous les contrôles au vert.

## Contraintes non négociables
- Stripe LIVE non activé ; aucune transaction réelle pour les tests.
- Aucun contournement de l'authentification, de la RLS ou des droits administrateur.
- Ne jamais annoncer une fonctionnalité non implémentée comme disponible.
- Ne pas fusionner avant la recette complète des trois lots.
