# Kitora P1 — Vérification et portes de sécurité (20 octobre 2026)

## Périmètre
La protection contre les mots de passe compromis est **exclue du plan P1 à la demande de l'exploitant**. Cette exclusion n'active pas la fonctionnalité et ne supprime pas l'avertissement Supabase ; ne pas présenter l'alerte comme corrigée.

## Constats vérifiés
- Supabase : cinq tables internes avec RLS activée et sans politiques ; requête sur `information_schema.role_table_grants` : **aucun GRANT direct aux rôles `anon` et `authenticated`** sur ces tables. Ne pas ajouter de politique ouverte pour supprimer une simple alerte INFO.
- GitHub : workflow `.github/workflows/kitora-v1-ci.yml` couvre les tests hors ligne, API publique, DB anonyme, navigateur Chromium, authentification, offres, IA et garde-fous paiements. La présence du workflow **ne prouve pas une exécution réussie**.
- CI : le connecteur de consultation des runs n'a pas confirmé de run réussi sur le SHA audité ; conserver ce point ouvert.

## Conditions de clôture P1 (périmètre retenu)
- [ ] Appliquer une règle de protection `main` et `release/**` exigeant CI réussie et revue, vérifier le blocage d'une fusion non validée. Ne jamais contourner les règles.
- [ ] Exécuter le workflow sur le SHA candidat et consigner les résultats réels des jobs.
- [ ] Stripe **TEST uniquement** : checkout, webhook signé, droits attribués, annulation, remboursements et rejets des signatures invalides, sans facturation LIVE.
- [ ] IA : exécuter une demande autorisée, observer file, quotas, traitement, sortie, erreurs et isolation des utilisateurs.
- [ ] Exploiter les journaux Auth, Edge, PostgreSQL et PostgREST avec des champs de statut vérifiés ; consigner les incidents et correctifs.

## Garde-fous
- Ne pas modifier les cinq tables serveur sans analyse de leurs consommateurs.
- Ne pas désactiver RLS ni exposer de clés serveur.
- Ne pas activer Stripe LIVE ; la conformité commerciale reste reportée.
- Ne pas présenter le P1 comme terminé avant preuves de tous les tests.
