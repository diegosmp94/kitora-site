# Kitora Command Center — Nouvelle interface d’administration

## Objectif

Offrir une expérience homogène et professionnelle sans réécrire les autorisations Supabase ni casser les contrôles métier déjà opérationnels.

### Vue d’ensemble

- **Tableau de bord** (`admin.html`) : quatre indicateurs déjà fournis par la fonction `admin-dashboard`, six accès rapides et message clair indiquant l’environnement de démonstration. Aucune métrique nouvelle inventée.
- **Catalogue** (`admin-products.html`) : formulaire existant, prévisualisation, filtres, recherche et export CSV.
- **Commandes** (`admin-orders.html`) : historique et filtres ; lecture seule.
- **Demandes** (`admin-requests.html`) : suivi et réponses aux abonnés.
- **Utilisateurs** (`admin-users.html`) : consultation du répertoire et du journal d’administration, sans création/suppression arbitraire.
- **Statistiques** (`admin-insights.html`) : indicateurs calculés sur les seules lignes accessibles et chargées.
- **Supervision** (`admin-health.html`) : signaux techniques et état Stripe TEST.

### Nouveau design commun

- `admin-workspace.css` : palette bleu nuit / Porto / doré, typographie hiérarchisée, menu latéral sur desktop, menu deux/trois colonnes sur mobile, tableaux et formulaires adaptés, réduction des animations au besoin.
- `admin-workspace.js` : lien actif, recherche dans les rubriques (raccourci `/` ou `Ctrl+K` sur desktop), et navigation au clavier. Le script ne réalise aucune requête sensible et ne modifie pas les données métiers.
- Les panneaux `adminProtected`, `healthProtected` et `adminPages` restent **masqués avant le contrôle de rôle** assuré par les scripts existants.

### Qualité et conformité

- Aucun paiement LIVE activé et aucune permission Supabase modifiée.
- Tests de structure : `tests/check-admin-workspace.mjs`.
- Tests Chromium : `tests/browser-admin-workspace.mjs` (7 rubriques, contrôle invité, clavier, largeurs 320/375/768/1280).
- CI existante conservée ; ne fusionner que lorsque les suites sont vertes.

### Limites connues et prochaines améliorations

1. Les fonctions administrateur doivent continuer de vérifier les droits **côté serveur et via RLS**. Un menu caché n’est jamais une autorisation.
2. L’accès administrateur avec MFA obligatoire et procédure de récupération nécessite une étape distincte après recette sur comptes réels.
3. Les tableaux sont limités aux lignes effectivement chargées ; les statistiques ne représentent pas nécessairement tout l’historique.
4. La protection des branches GitHub, préparée dans `security/github-rulesets`, doit encore être activée par le propriétaire dans GitHub Settings. Des fichiers JSON seuls ne bloquent rien.
5. Les exports CSV et le journal d’activité doivent rester accessibles aux seuls administrateurs autorisés ; tester deux comptes distincts avant ouverture B2B généralisée.
