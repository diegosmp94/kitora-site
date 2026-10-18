# Kitora V1.0 — Release readiness (18 octobre 2026)

## Périmètre confirmé
- Kitora Free : sans achat ni Stripe.
- Kitora Plus mensuel : 5,99 EUR / mois, **test uniquement**, prix Stripe `price_1UP4v10xrx52eQIk6SUhtkEC`.
- Kitora Plus annuel : 59,90 EUR / an, **test uniquement**, prix Stripe `price_1UP4v70xrx52eQIkhGEYRCvZ`.
- Kitora Solo : 1,99 EUR / mois, prix TEST inactif `price_1URu9f0xrx52eQIktWX2gQz4`.
- Kitora Workspace : 3,99 EUR / mois, prix TEST inactif `price_1URu9i0xrx52eQIkVxpEisbc`.
- Kitora Ultimate : 8,99 EUR / mois, prix TEST inactif `price_1URu9k0xrx52eQIkFYwnKPP4`.

Les trois offres envisagées restent désactivées dans Stripe et non disponibles à l'achat. Ne pas en activer les prix tant que les droits, quotas, données et parcours ne sont pas implémentés et testés.

## Stripe TEST
- Compte « Kitora » : `acct_1UP4q20xrx52eQIk` (test).
- Un autre compte connecté « environnement de test Kitora » possède également un endpoint pointant sur la même fonction Supabase. Il faut identifier la clé serveur utilisée par `create-checkout` et vérifier l'association au compte voulu avant de fixer définitivement des `price_id` dans le backend.
- Webhook Stripe test configuré : événements Checkout terminé, abonnement créé/mis à jour/supprimé, facture payée/échouée.
- Portail test de facturation configuré avec factures, modification du moyen de paiement et résiliation en fin de période.

## Statut d'ouverture
**NO-GO : facturation réelle.**
Les fonctions Checkout et Customer Portal refusent volontairement les clés de production. Aucune tentative de passage en live ne doit être faite avant recette signée.

## Recette obligatoire avant V1 payante
- [ ] Compte Stripe lié à la clé serveur confirmé.
- [ ] Checkout mensuel et annuel testés avec des comptes Auth réels de test.
- [ ] Webhook signé : activation abonnement dans Supabase après paiement.
- [ ] Rejeu d'un événement et livraison désordonnée sans état incorrect.
- [ ] Renouvellement payé, impayé, reprise, résiliation et changement de formule.
- [ ] Historique des commandes exact, sans revenu test présenté comme encaissé.
- [ ] Portail de facturation accessible, factures et annulation fonctionnelles.
- [ ] Quotas IA atomiques, qualité des résultats et erreurs fournisseur validés.
- [ ] Vérification des droits RLS et contrôle multi-compte.
- [ ] Mots de passe compromis : protection Auth activée.
- [ ] CGV, mentions légales, confidentialité, rétractation et support validés.
- [ ] Surveillance d'incident, sauvegardes et procédure de retour arrière documentées.

## Politique de lancement
Séparer strictement la publication de la V1 gratuite et l'activation de la facturation réelle. Les tarifs affichés comme « projet » ne constituent pas des engagements contractuels.
