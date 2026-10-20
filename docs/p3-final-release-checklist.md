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
- [x] Tableau de bord agrégé réservé aux administrateurs pour les commandes TEST, abonnements actifs et accès bibliothèque existants ; aucune métrique fictive.
- [ ] Tableau de bord de trafic/conversion après instrumentation réelle et validation de la confidentialité.
- [ ] Vérifier la confidentialité, les politiques RLS, la rétention et les parcours opt-out si nécessaires.

### Espace organisations B2B
- [x] Table `kitora_organizations` créée dans Supabase avec RLS propriétaire (SELECT, INSERT, UPDATE, DELETE), sans accès SELECT anonyme.
- [x] Page `organisation-pro.html` : création et liste des organisations liées au compte, sans abonnement activé.
- [x] Scénarios Chromium simulés : visiteur non connecté, propriétaire, insertion refusée avec erreur publique générique.
- [ ] Vérifier les accès croisés entre deux comptes réels distincts et les politiques RLS de bout en bout.
- [ ] Gestion des membres, invitations, rôles et permissions d'équipe.
- [ ] Souscriptions B2B, droits serveur et facturation Stripe TEST, puis recette complète.

### Recette globale lots 1, 2 et 3
- [x] Neuf workflows GitHub réussis sur `748e116` (y compris Chromium, sécurité des branches et contrôles de livraison). Cela ne constitue pas une recette Supabase/Stripe réelle.
- [x] Studio invité et authentifié avec Supabase simulé ; facture et simulateur testés sous Chromium.
- [ ] Test de bout en bout sur un environnement de préproduction isolé avec Supabase réel et comptes de test dédiés.
- [ ] Test Stripe TEST : choix mensuel/annuel, checkout, webhook signé, activation et révocation des droits, renouvellement, annulation, erreurs.
- [x] Test Chromium des routes marketplace et des catégories, des tarifs mensuel/annuel et du blocage des checkouts non disponibles (UI uniquement). 
- [ ] Test du catalogue/marketplace : disponibilité réelle, panier, paiement TEST et livraison numérique uniquement si implémentés.
- [ ] Test des rôles administrateur avec comptes dédiés et vérification RLS côté serveur.
- [ ] Contrôle accessibilité, mobile, navigation, performances, mentions légales et politiques de données.
- [ ] Revue de la PR #68 et fusion unique après tous les contrôles au vert.

## Diagnostic de blocage — 20 octobre 2026
- **CI** : aucun workflow en échec sur `748e116`. Les contrôles automatisés existants passent.
- **Blocage produit** : permissions d'équipe et abonnements B2B non implémentés ; instrumentation de conversion absente ; cycle Stripe TEST non validé avec de véritables comptes et événements.
- **Livrable sûr** : outils Pro, devis, facturation, simulateur, statistiques administrateur et création d'organisation, en conservant les offres B2B explicitement non commercialisées.
- **Interdiction** : ne pas remplacer des tests d'intégration réels par des tests simulés pour déclarer le lot 3 terminé ; ne pas fusionner sans accord sur une livraison partielle ou validation complète.

## Contraintes non négociables
- Stripe LIVE non activé ; aucune transaction réelle pour les tests.
- Aucun contournement de l'authentification, de la RLS ou des droits administrateur.
- Ne jamais annoncer une fonctionnalité non implémentée comme disponible.
- Ne pas fusionner avant la recette complète des trois lots.
