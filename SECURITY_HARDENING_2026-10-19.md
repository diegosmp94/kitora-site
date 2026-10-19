# Kitora Security Hardening — correctifs et limites (19 octobre 2026)

## Changements inclus

| Audit | Remédiation | État |
|---|---|---|
| SEC-01 | Révocation SQL de `TRUNCATE`, `TRIGGER`, `REFERENCES` sur `kitora_invoice_drafts` et `kitora_org_profiles` ; maintien des opérations CRUD sous RLS ; suppression EXECUTE public sur fonctions de trigger | **Appliqué à Supabase et vérifié par SQL** |
| SEC-02 | L'éditeur de facture est en mémoire seulement. Les anciens brouillons sensibles du navigateur sont supprimés lors de la prochaine visite de la page. Sauvegarde volontaire dans Supabase seulement. La fermeture/recharge sans sauvegarde entraîne la perte des modifications locales. | Code en PR |
| SEC-03 | Protection des mots de passe compromis à activer dans la console Supabase Auth (le connecteur ne permet pas de modifier ce réglage). MFA administrateurs à préparer et tester. | **Action manuelle requise** |
| SEC-04 | Webhook Stripe LIVE transactionnel via RPC service-role-only : déduplication, verrou par utilisateur, état Stripe courant, refus de rétrogradation par ancien abonnement ; kill switch pour le checkout LIVE | Code SQL/Edge en PR, déploiement conditionné à recette |
| SEC-05 | Pin explicite Supabase SDK 2.57.0 dans les modules JavaScript identifiés ; CSP restrictive sur la page de facturation ; chargement de scripts protégés borné aux fichiers JS de même origine | Code en PR ; CSP reste à généraliser et à vérifier sur le site public |
| SEC-06 | Régression Chromium du nettoyage des brouillons et contrôle de sécurité SQL ; reste nécessaire de tester deux vrais utilisateurs indépendants, sans données réelles, sur une préproduction dédiée | **Partiel** |
| SEC-07 | Restriction du chargeur de scripts à la même origine. Les JS statiques restent publics : le contrôle des licences et ressources payantes doit continuer à être assuré serveur/RLS, jamais par seul contrôle navigateur. | **Partiel** |
| SEC-08 | Quota de 100 brouillons cloud par propriétaire contrôlé en base ; contrôle par transaction et index existant ; guide pour alertes, rétention RGPD et restauration | Code en PR ; supervision opérationnelle à construire |

## Limites et vérifications avant LIVE

1. **Bloquer la vente LIVE** tant qu'une recette Stripe complète avec événements signés, retards, doublons, annulations, réabonnements et remboursements n'est pas passée. `KITORA_LIVE_CHECKOUT_ENABLED` doit rester absent ou différent de `true`.
2. Activer la détection des mots de passe divulgués : Supabase Dashboard > Authentication > Password Security. Référence : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
3. Mettre en place la MFA et des sessions d'administration à niveau AAL2 après une procédure de récupération de compte validée ; ne pas activer brutalement des restrictions qui enferment l'administrateur hors du site.
4. Faire des tests inter-comptes réels : A ne peut ni lire, ni modifier, ni supprimer les données de B, notamment les profils organisationnels, brouillons, projets, abonnements, commandes et privilèges admin.
5. Vérifier TLS, en-têtes HTTP, CSP effective, scripts externes, cookies et permissions côté GitHub Pages et fournisseur DNS. Une balise CSP ne remplace pas les en-têtes `frame-ancestors` et HSTS contrôlés par l'hébergeur.
6. Définir et faire valider les durées de conservation, purges, sauvegardes, restauration, DPA/Sous-traitants et information RGPD des clients professionnels.
7. Ajouter alertes et métriques Auth, Stripe LIVE, Edge Function, tentatives d'abus, quotas IA, erreurs RLS et coûts ; ne jamais enregistrer de secrets.
8. Conserver la séparation `TEST` / `LIVE`, ne jamais utiliser une clé service-role dans le navigateur et assurer la rotation des secrets au moindre soupçon d'exposition.

## Mode opératoire sûr

- Les migrations de permissions ont été vérifiées en base après application.
- Les nouvelles migrations Stripe et quota sont conçues pour être appliquées dans l'ordre **avant** la version Edge correspondante.
- Si la CI échoue, ne pas fusionner ni déployer les fonctions sensibles.
- Ne jamais interpréter des tests simulés comme la preuve d'une sécurité « 100 % ».
- Après fusion, vérifier GitHub Pages en navigateur réel et les journaux Supabase.

## SEC-09 — GitHub : protection des branches de code

- **Constat vérifié le 19/10/2026 :** l'API GitHub rapporte `main.protected = false` et zéro ruleset installé. Le connecteur GitHub utilisé ici peut lire ces paramètres mais ne peut ni importer ni activer les protections d'administration (403 pour la protection classique).
- **Correctif préparé :** `security/github-rulesets/main.json`, `release.json`, `working.json`, `.github/CODEOWNERS`, workflow `Kitora branch security` et test `tests/check-branch-governance.mjs`.
- **État :** EN ATTENTE D'ACTIVATION PAR LE PROPRIÉTAIRE dans GitHub Settings → Rulesets (la présence des JSON dans le dépôt ne protège **aucune** branche).
- **Mode opératoire :** [security/BRANCH_PROTECTION_SETUP.md](security/BRANCH_PROTECTION_SETUP.md).
- **Vérification exigée après activation :** champ `protected:true` pour `main`, trois rulesets actifs, six checks requis sur une PR.
