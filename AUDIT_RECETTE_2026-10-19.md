# Kitora — Audit de recette du 19 octobre 2026

## Périmètre et méthode
20 critères binaires, poids égaux. Un critère est validé s'il est constaté via les outils ou, pour le paiement TEST uniquement, déclaré testé avec succès par le propriétaire. Un déploiement n'équivaut pas à un test de fonctionnement.

**12/20 critères validés = 60 % de la checklist de lancement.** Ce score n'est pas un taux de disponibilité, ni un taux de sécurité ni une probabilité de vendre.

## Critères validés (12)
1. [x] CI GitHub générale réussie (run #59)
2. [x] CI GitHub de livraison réussie (run #24)
3. [x] Contrôles de syntaxe JS en CI
4. [x] Parcours visiteur automatisé passé
5. [x] Contrôles automatisés d'accès invité / gratuit / payant (tests simulés)
6. [x] Contrôle navigateur accessibilité réussi sur dernière CI
7. [x] 11 fonctions Supabase déclarées ACTIVE
8. [x] Tables TEST/LIVE séparées et protection RLS en place (structure seulement)
9. [x] Paiement Stripe TEST vérifié par le propriétaire (déclaration utilisateur)
10. [x] Checkout LIVE déployé (pas encore utilisé en production)
11. [x] Portail client LIVE déployé
12. [x] Webhook LIVE déployé

## Critères non validés (8)
13. [ ] Traitement webhook TEST de bout en bout vérifié indépendamment
14. [ ] Prix Stripe LIVE activés — actuellement **2 inactifs**
15. [ ] Événement webhook LIVE signé traité et confirmé — **0 événement**
16. [ ] Abonnement LIVE correctement activé en base — **0 abonnement**
17. [ ] Achat LIVE + service livré + annulation testés de bout en bout
18. [ ] Génération IA réelle testée, fichiers téléchargeables
19. [ ] Obligations commerciales et documents légaux validés
20. [ ] Branche de livraison fusionnée, publiée et vérifiée

## Bloqueurs P0
- Absence de preuve de l'exécution complète Stripe LIVE → Supabase → droits premium → portail.
- Aucune preuve actuelle d'une génération IA réelle, bien qu'une fonction soit déployée.
- Finalisation légale/commerciale indispensable avant paiement public.

## Données constatées
- GitHub dernière exécution de référence: commit a1edf0b7, 2 workflows success.
- Supabase: 11 fonctions actives; kitora_live_subscriptions 0; kitora_live_webhook_events 0; subscriptions historiques 1.
- Stripe LIVE: price_1US0oF0xrx52eQIkdmRbsUqu (mensuel), price_1US0oI0xrx52eQIkipQfK3Pm (annuel), toutes deux actives=false.
- Le dernier frontend est sur la branche release/kitora-v1-ready-20261018. Le garde-fou du panier garde le paiement LIVE fermé.

## Décision
**NO-GO paiements publics LIVE**. Le TEST fonctionnel est acquis sur déclaration, mais ne suffit pas à certifier le passage en LIVE.

## Travail suivant
1. Confirmer présence/configuration serveur des secrets Stripe (ne jamais les publier).
2. Tester livraison et révocation des droits avec événements signés Stripe.
3. Tester création IA réellement et téléchargement.
4. Réaliser la revue de conformité, puis seulement activer prix et fusionner après CI.
