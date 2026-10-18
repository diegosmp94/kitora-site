# Kitora — File de générations IA prioritaire (version bêta)
**État : Supabase PostgreSQL + Vault + Edge Functions + Cron configurés le 18 octobre 2026.** La génération effective de documents n'est pas encore validée de bout en bout sur des comptes utilisateurs de test.

## Architecture
1. `generate-plus` vérifie le JWT Supabase, l'appartenance du dossier et l'abonnement Plus/Ultimate.
2. Une réservation atomique empêche de dépasser les quotas déjà configurés (Plus 10, Ultimate 30/mois).
3. `kitora_ai_jobs` enregistre une tâche par demande. Plus reçoit une priorité de base 0 ; Ultimate 10.
4. `kitora_claim_ai_job()` prend une tâche atomiquement avec `FOR UPDATE SKIP LOCKED` et un jeton de bail. L'ancienneté rehausse peu à peu une tâche en attente pour éviter une famine des tâches Plus.
5. Supabase Cron `kitora-ai-priority-worker` (toutes les minutes) appelle `kitora-ai-worker` via pg_net. Le secret d'authentification est généré et stocké uniquement dans Supabase Vault. L'Edge Function le vérifie par une RPC inaccessible aux utilisateurs publics.
6. `kitora-ai-worker` effectue une génération, vérifie l'état de l'abonnement, enregistre le document, termine la réservation, et clôture la tâche. Si une erreur apparaît, le job est retenté au maximum trois fois avec une attente croissante ; les baux expirés sont récupérés par la requête de prise.
7. L'interface Admin / Supervision affiche les tâches en attente, en cours, en échec et les tâches Ultimate en attente.

## Sécurité
- Le token Vault ne doit jamais apparaître dans GitHub, les fichiers HTML ou les journaux.
- Seul `service_role` peut lire ou modifier `kitora_ai_jobs` et exécuter les fonctions privées de vérification/prise.
- `KITORA_GROQ_ENABLED` agit comme interrupteur de génération côté serveur. Les paiements Stripe LIVE restent désactivés.
- Si les API d'IA sont désactivées, la fonction worker ne prend aucune tâche.
- Pour interrompre la file : désactiver les appels IA puis, si nécessaire, `select cron.unschedule('kitora-ai-priority-worker');`. Une interruption du cron laisse les jobs en attente et aucun traitement n'est exécuté.
- La file stocke les identifiants et métadonnées des dossiers, pas les secrets API ni les prompts privés. Le worker charge le dossier autorisé depuis `subscriber_requests`.

## Capacité et limites
- Une tentative de traitement par minute environ : la capacité actuelle convient à une petite bêta, **pas une garantie de délai**. L'algorithme n'est pas une priorité contractuelle SLA.
- Le job `processing` est récupérable après 3 minutes ; les tâches de longue durée doivent rester en dessous de cette fenêtre.
- Certains échecs terminaux demandent un nouveau dossier ; un abonnement expiré doit être renouvelé.
- Si l'API IA est activée, ses appels peuvent engendrer des coûts fournisseur distincts de Stripe. Surveiller le budget.
- Il n'est pas nécessaire de déployer un mini-serveur. En cas de croissance (plusieurs milliers de tâches quotidiennes, exigences de temps réel, besoin d'une capacité de traitement parallèle), envisager un véritable service de workers avec une infrastructure séparée.

## Tests de validation à réaliser avant ouverture
- Deux comptes de test Plus et Ultimate connectés : envoi de demandes simultanées, ordre de prise, anti-doublon et vérification du quota.
- Génération valide, mauvais format de réponse du fournisseur, panne réseau, erreurs 429/500, trois tentatives maximum, remboursement/expiration entre la mise en file et le traitement.
- Reprise d'un bail perdu, traitement idempotent du même dossier, protection contre une tentative de prendre la tâche d'un autre compte.
- Vérification d'une véritable livraison des tâches via pg_net, des logs des deux Edge Functions et des compteurs de la supervision.
- Le Cron et le worker ont été testés **sans tâche réelle** : réponse HTTP 200 avec `{"status":"idle"}`. Aucune génération payante n'a été déclenchée par ce test.

## Commandes de diagnostic (sans secret)
```sql
select jobname,schedule,active from cron.job where jobname='kitora-ai-priority-worker';
select status,plan,count(*) from public.kitora_ai_jobs group by status,plan;
select * from public.kitora_claim_ai_job(); -- À ne pas utiliser si des tâches réelles sont en attente : cette commande prend une tâche.
```
