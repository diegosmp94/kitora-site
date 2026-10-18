# Kitora — Passage TEST vers production payante
Date : 18 octobre 2026
Statut : **NO-GO paiements réels — environnement live accessible mais pas configuré ni validé.**

## État constaté via les connexions en temps réel
- GitHub Pages : déployé ; les derniers workflows de publication et de non-régression sont réussis.
- Supabase : Auth, PostgreSQL, RLS et les Edge Functions fonctionnent en bêta ; revue de sécurité et essais multi-comptes encore nécessaires.
- Checkout : la fonction serveur `create-checkout` n'accepte que les clés `sk_test_`.
- Webhook : `stripe-webhook` rejette expressément les événements Stripe live.
- Compte Stripe LIVE **Kitora** : zéro prix, zéro endpoint webhook, zéro abonnement au moment de la vérification.
- Compte Stripe TEST : formules Solo/Workspace/Plus/Ultimate définies dans le serveur ; seul Plus propose un tarif annuel 59,90 €. Les autres sont mensuelles en démonstration.
- IA : file prioritaire Ultimate installée, mais aucun cycle réel complet documenté sur des comptes de test. Ne pas promettre un service IA opérationnel ni des délais.
- Sauvegarde Workspace : écriture atomique et contrôle de conflits, sans synchronisation bidirectionnelle complète.

## Preuves requises pour passer au GO

### 1. Exploitant et conformité
- Titulaire du compte Stripe autorisé contractuellement, identité vérifiée ; si mineur, procédure légale et intervention d'un représentant légal appropriées.
- Informations de l'éditeur (immatriculation, adresse de contact, coordonnées) validées et publiables.
- CGV/CGU, droit de rétractation et éventuelles exceptions à faire confirmer légalement ; confirmation de commande et support durable.
- Politique de confidentialité et traitements RGPD, relation avec prestataires et durées de conservation vérifiés.
- Résiliation en ligne conforme, contact support et médiateur de la consommation le cas échéant.

### 2. Facturation et droits
- Compte LIVE choisi explicitement, produits/prix Stripe live créés **après validation commerciale**, et mapping des prix côté serveur, sans montant fourni par navigateur.
- Endpoint webhook live créé pour le **même compte** et secret configuré dans un environnement serveur dédié (jamais dans GitHub Pages).
- Aucun événement LIVE ne doit être envoyé dans un webhook encore réservé au mode TEST.
- Webhook signé, dédoublonné et idempotent, y compris doublons et événements désordonnés.
- Test d'abonnements Stripe TEST pour toutes les offres : checkout, renouvellement, impayé, annulation, réactivation, factures, remboursement, double tentative et changement de plan.
- Vérification par deux utilisateurs distincts : chacun ne doit accéder qu'à ses documents, abonnements et sauvegardes.
- Portail client et annulation accessibles en ligne et réellement synchronisés avec Supabase.
- Scénario de rollback et restauration documentés.

### 3. Fiabilité du produit
- Tests client réels, distincts des simulations de compte Chromium.
- Génération IA réussie puis erreurs/timeout/retry testés avec contrôle des quotas et des coûts.
- Sauvegarde/restauration sur deux appareils, résolution des conflits et absence de pertes de données.
- Alertes externes actives ; supervision et procédure d'intervention en place.
- Protection contre les mots de passe compromis activée dans Supabase Auth (avertissement sécurité actuel).

## Séquence de mise en service sûre
1. Compléter les documents et obtenir les validations légales.
2. Achever la recette Stripe TEST et la recette IA complète.
3. Séparer les secrets Stripe TEST et LIVE et mettre en place un déploiement de secours.
4. Configurer le catalogue Stripe LIVE approuvé, le webhook LIVE, l'authentification et le portail client dans un environnement serveur distinct.
5. Tester les réponses serveur sans exposer de données personnelles et réexaminer tous les droits d'accès.
6. Activer l'ouverture payante à un petit groupe autorisé après contrôle, avec surveillance rapprochée et fonction de désactivation immédiate.

**Ne pas déclarer « 100 % prêt » sur la seule réussite des tests statiques, l'accès au dashboard Stripe LIVE ou la présence d'un webhook.**
