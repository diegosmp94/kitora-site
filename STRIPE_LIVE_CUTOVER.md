# Kitora LIVE — Procédure de bascule

## Situation vérifiée le 18/10/2026
- Compte Stripe LIVE: charges_enabled=true, payouts_enabled=true, details_submitted=true.
- Prix Kitora Plus LIVE créés mais désactivés: mensuel `price_1US0oF0xrx52eQIkdmRbsUqu`, annuel `price_1US0oI0xrx52eQIkipQfK3Pm`.
- Aucun endpoint webhook LIVE existant au moment du contrôle.
- Fonctions Supabase `create-checkout`, `customer-portal`, `stripe-webhook` configurées uniquement pour TEST.
- **AUCUN PAIEMENT LIVE À AUTORISER** tant que les critères ci-dessous ne sont pas validés.

## Préparatifs obligatoires
1. Ajouter des secrets LIVE distincts dans Supabase, côté serveur uniquement: `STRIPE_LIVE_SECRET_KEY` et `STRIPE_LIVE_WEBHOOK_SECRET`. Ne jamais les ajouter au dépôt GitHub.
2. Déployer un checkout LIVE distinct qui utilise uniquement des `price_...` actifs du compte LIVE et vérifie l'identité de l'utilisateur; aucune confiance dans les montants envoyés par le navigateur.
3. Déployer un webhook LIVE distinct avec signature Stripe vérifiée, traitement idempotent, gestion des tentatives et des événements en désordre, plus traces et alertes.
4. Créer/configurer l'endpoint LIVE pour le webhook LIVE et abonnements: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
5. Garantir qu'un abonnement TEST ne bloque pas à tort l'achat LIVE et ne soit jamais pris pour un abonnement LIVE; prévoir une colonne de mode ou des tables explicitement séparées avec migration de données non destructive.
6. Adapter le portail de facturation et la commande pour le mode LIVE.
7. Tester les paiements, les renouvellements, les échecs et les résiliations, le traitement des doubles événements, la récupération de session, et la restauration.
8. Confirmer les exigences légales et les conditions d'éligibilité du titulaire du compte avant ouverture commerciale.
9. Vérifier sur les navigateurs réels le parcours: visite > inscription > paiement > droits actifs > génération IA > facture > annulation.

## Vérification avant fusion
Ne fusionner la branche vers `main` qu'après preuves de tests automatisés et manuels concluants, et mise en place d'un retour arrière.
