# Kitora — Protection réelle des branches GitHub

Date : 19 octobre 2026 · Dépôt : `diegosmp94/kitora-site`.

## Diagnostic confirmé

- L'API GitHub Branch retourne `protected: false` pour `main`.
- L'API `/rulesets` retourne une liste vide (`[]`).
- L'API GitHub de protection classique est interdite à l'intégration GitHub connectée (`403 Resource not accessible by integration`). Les outils de cette intégration ne peuvent **pas** créer ni activer de ruleset.
- Les cinq suites de CI existantes étaient vertes à la fusion du correctif cybersécurité #44, mais **aucune** n'interdit par elle-même un push direct sur une branche non protégée.

Conclusion : l'ajout de workflows et de fichiers `CODEOWNERS` est une préparation technique ; **le blocage effectif exige une activation par le propriétaire dans Settings → Rulesets**.

## À effectuer — import JSON dans GitHub

Ouvrir : https://github.com/diegosmp94/kitora-site/settings/rules

GitHub permet l'import de règles JSON depuis l'interface : **New ruleset → Import a ruleset**, choisir le fichier, vérifier, puis **Create**. Télécharger les JSON du dépôt (bouton « Download raw file ») et importer chacun :

1. [main.json](github-rulesets/main.json) — **obligatoire**, uniquement `main`. Impose PR avant fusion, six checks CI, branche à jour, historique linéaire, résolution des conversations, supprime force-push et suppression de la branche. Pas de bypass.
2. [release.json](github-rulesets/release.json) — branches `release/*`. Interdit force-push et suppression accidentelle, sans exiger de contrôles CI non disponibles pour les PR ciblant `release/*`.
3. [working.json](github-rulesets/working.json) — `feature/*`, `fix/*`, `security/*`, `maintenance/*`, `tests/*`. Interdit de réécrire leur historique, tout en permettant de les supprimer après fusion.

**Important :** ne pas sélectionner « Restrict updates » sur `main` sans rôle de bypass explicitement configuré ; cela empêcherait aussi les fusions autorisées. Les règles sélectionnées couvrent l'objectif sans verrouiller accidentellement le dépôt.

## Six checks exacts à rendre obligatoires sur main

GitHub s'appuie sur le **nom exact des jobs**, pas forcément celui de la workflow. Les jobs ont été vérifiés sur de précédentes exécutions ; le sixième est nouveau et doit avoir réussi dans une PR avant l'import.

| Job (status check) | Workflow |
|---|---|
| `Site, plans, IA and payment guardrails` | Kitora V1 automated checks |
| `solutions` | Kitora B2B B2C solutions |
| `workspace` | Kitora 3 workspace checks |
| `catalogue` | Kitora kits catalogue checks |
| `legal` | Kitora legal pages checks |
| `branch-security-gate` | Kitora branch security |

Le fichier importable `main.json` contient les six checks. Au moment de l'import, vérifier que GitHub les reconnaît, et attribuer **GitHub Actions comme source attendue** si l'interface le propose et qu'elle affiche cette option pour tous les checks. Si un check est absent, le faire exécuter une fois depuis une PR, puis réimporter / modifier la règle ; ne jamais désactiver les checks pour contourner une CI cassée.

Le mode **strict** demande que la PR soit à jour par rapport à `main` avant fusion.

## Revue humaine : recommandations pour un dépôt individuel

Ce dépôt appartient à un compte personnel. Un auteur ne peut pas approuver sa propre PR comme approbateur indépendant. Par conséquent, le ruleset initial propose `required_approving_review_count: 0` et `require_code_owner_review: false` afin de ne pas bloquer indéfiniment le projet.

Pour renforcer la sécurité à terme, ajouter **au moins un mainteneur de confiance avec accès écriture**, puis passer les approbations obligatoires à **1**, activer la révocation d'approbation après nouveau commit et les revues CODEOWNERS. Ne pas ajouter un utilisateur inconnu uniquement pour satisfaire cette règle.

`.github/CODEOWNERS` liste les emplacements sensibles (`.github/`, `supabase/`, facturation, tests), mais **CODEOWNERS seul n'empêche aucune fusion**.

## Vérification après activation

1. Visiter https://api.github.com/repos/diegosmp94/kitora-site/branches/main — le champ `protected` doit être `true`.
2. Visiter https://api.github.com/repos/diegosmp94/kitora-site/rulesets — voir les trois rulesets à l'état `active`.
3. Créer une PR de test avec un changement non sensible et confirmer que les six checks apparaissent comme **Required**.
4. Ne pas faire de force-push destructif comme test : contrôler les règles et les refus via l'interface GitHub / Rule Insights.
5. Garder les protections en place pour les comptes administrateurs, sans ajouter de contournement permanent.
6. Vérifier si les workflows et les paramètres de sécurité sont couverts par les mécanismes d'audit / de notification du dépôt.

## Limites et suivi

- Les rulesets constituent le **seul verrou effectif** dans ce plan. Une CI qui échoue sur `main` après un push direct est une alerte *après coup*, pas une barrière.
- Les règles `release/*` et de travail ne garantissent pas que ces branches soient exemptes de failles ; elles contrôlent ici la réécriture d'historique et la suppression.
- Le scanner embarqué recherche des motifs de secrets à forte confiance mais ne remplace pas **GitHub Secret Scanning**, l'analyse de dépendances, le contrôle de versions et la revue des PR.
- Le verrouillage du seul code ne protège pas automatiquement Supabase, Stripe ou GitHub Pages : appliquer le moindre privilège aux accès et aux secrets des déploiements.
- Ne pas rendre une vérification GitHub Actions dépendante d'un service temporairement indisponible sans stratégie de reprise documentée.

Documentation GitHub :
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
