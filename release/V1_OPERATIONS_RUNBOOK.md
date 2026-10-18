# Kitora — Runbook d'exploitation V1.0 bêta

> Version du 18 octobre 2026. **Stripe TEST uniquement — ne pas activer les clés live sur cette version.**

## Santé du service
- Supervision manuelle authentifiée : `admin-health.html`.
- Edge Function agrégée `kitora-health` : accessible seulement après `auth.getUser()` et appartenance vérifiée à `kitora_admins`. Réponses sans données individuelles.
- Signaux relevés : webhooks en attente, webhooks bloqués plus de 10 minutes, abonnements en retard, abonnements actifs en test, réservations IA inachevées plus de 10 minutes.
- **Non couvert** : notification automatique, suivi de latence, SLA contractuel, disponibilité des prestataires Stripe et IA. Installer une sonde externe et une destination d'alerte avant l'ouverture payante.

## Pannes et décisions
1. **Webhook en retard** : contrôler les livraisons Stripe TEST, la signature, les journaux Supabase et la table `kitora_stripe_webhook_events`. Ne pas écraser manuellement `subscriptions` sans rapprocher avec Stripe.
2. **Paiement refusé** : ne pas octroyer les avantages premium ; vérifier l'événement `invoice.payment_failed`, puis inviter le client à mettre à jour son moyen de paiement via le portail.
3. **IA indisponible** : laisser `KITORA_GROQ_ENABLED` à `false`, expliquer l'indisponibilité, ne pas promettre de document immédiat, surveiller les réservations bloquées.
4. **Réservations IA inachevées** : comparer chaque entrée à `subscriber_requests.ai_generated_at` et aux logs avant toute intervention manuelle. Ne jamais effacer sans vérifier si le document a été produit.
5. **Conflit de sauvegarde cloud** : ne jamais écraser automatiquement la version distante. Utiliser la restauration ou sauvegarde manuelle après export local et vérification des deux versions.

## Accès et secrets
- Clés Stripe : jamais dans GitHub ni dans les pages. Les Edge Functions Checkout et webhook conservent le refus du mode live.
- Table `kitora_ai_reservations` : aucun droit d'écriture pour les rôles publics ou authentifiés ; opérations via rôle serveur.
- `kitora_workspace_backup` : accès par propriétaire avec RLS, droits TRUNCATE/TRIGGER/REFERENCES révoqués pour les clients.
- Aucun jeton client, e-mail ou identifiant privé dans les messages d'alerte publics.

## Sauvegardes et rollback
- Effectuer une exportation de sécurité de la base avant migrations supplémentaires.
- Vérifier la restauration d'une sauvegarde sur environnement isolé, y compris l'absence de données mélangées entre utilisateurs.
- Les versions des Edge Functions `generate-plus` et `kitora-health` sont à conserver ; documenter leur code source et migrations dans le dépôt.
- Rollback applicatif via PR GitHub inverse ; rollback BDD uniquement après vérification des données récentes, ne pas supprimer les abonnements ou factures.

## Recette manquante (bloquante pour la vente)
- Connexion des comptes de test, abonnement à chacune des cinq offres, attribution des droits, résiliation, remboursement, renouvellement, webhook rejoué, événements dans le désordre.
- Deux navigateurs/appareils : autosave, conflits, restauration et confirmation d'absence de perte.
- Génération IA : quota Plus 10 / Ultimate 30 avec demandes concurrentes ; libération des réservations après erreur ; test de facture fournisseur.
- Documents vendeur, conformité consommateur/RGPD, conditions de rétractation et confirmations de commande, revue humaine avant publication.
- File de traitement prioritaire Ultimate à construire ; aucun engagement de priorité pour l'instant.
