# Kitora — Administration des utilisateurs (développement sécurisé)

Cette branche prépare l'extension de l'administration existante sans changer son design.

## État constaté
- Page existante : `admin.html`, scripts `admin.js` et `admin-insights.js`.
- Contrôle d'accès existant : `kitora_admins` et fonction `admin-dashboard`.
- `profiles.plan` et `subscriptions.plan` n'acceptent actuellement que `free`, `plus_monthly`, `plus_yearly`.
- Les opérations sur Supabase Auth ne doivent jamais être effectuées depuis GitHub Pages avec une clé privilégiée.

## Contrat serveur prévu
Créer une fonction Edge `admin-users` qui vérifie le JWT via Supabase Auth, puis l'appartenance du demandeur à `kitora_admins` côté serveur pour chaque requête.

Actions :
- `list` : pagination, recherche par e-mail et nom, filtres statut/rôle/offre, réponses minimisées.
- `create` : valider e-mail et nom, invitation par e-mail (sans mot de passe transmis à l'admin).
- `update` : champs autorisés uniquement, vérification des valeurs.
- `set_role` : interdire la suppression du dernier administrateur et l'auto-rétrogradation.
- `set_plan` : respecter les abonnements Stripe ; ne pas modifier un abonnement facturé sans procédure de facturation explicite.
- `disable` : blocage côté Auth avec invalidation/révocation des sessions selon la capacité disponible ; contrôle d'accès serveur à chaque requête sensible.
- `delete` : confirmation explicite et vérification des dépendances, conservation des traces non sensibles conformément à la politique de rétention.
- `password_reset` : envoi d'un lien de récupération via le service Auth, jamais de mot de passe en clair.
- `audit` : journal des opérations, acteur, cible, date, résultat ; ne pas enregistrer les jetons ni les secrets.
- `stats` : nombre total, actifs, désactivés, par offre, créations récentes.

## Prérequis avant mise en production
1. Ajouter une table d'audit protégée par RLS, non modifiable par les utilisateurs.
2. Vérifier les politiques actuelles de `profiles`, `subscriptions`, `kitora_admins`.
3. Aligner le catalogue d'offres avec Free/Solo/Workspace/Plus/Ultimate et la facturation test.
4. Implémenter la fonction et ses tests d'autorisation (anonyme, utilisateur normal, administrateur).
5. Brancher un onglet Utilisateurs dans `admin.html` en réutilisant les classes CSS existantes.
6. Tester les confirmations, filtres, pagination et erreurs sans toucher aux comptes réels.
7. Ne fusionner sur `main` qu'après validation ; ne pas activer Stripe live.
