# Kitora — Disponibilité réelle des packs (19 octobre 2026)

Les mentions ci-dessous distinguent les **fonctionnalités codées**, les **abonnements de démonstration**, et le **service marchand LIVE**.

| Pack | État démontrable | Fonctions actuellement en place | Limitations |
|---|---|---|---|
| Free | Activé, gratuit | Dashboard, Projects, Learn, Agenda, Notes, Templates, etc. | Compte et sélection Free pour les outils protégés |
| Solo | Accès TEST actif | Free, export CSV/Markdown (Projects, Notes, Agenda, Learn) | Pas de facturation LIVE |
| Workspace | Accès TEST actif | Solo, statistiques locales, opt-in cloud avec contrôle des conflits | Cloud bêta, restauration manuelle, pas d'équipe |
| Plus mensuel / annuel | Accès TEST et atelier en place | Plus Lab, création et suivi de demandes, exports sous conditions | Génération IA réelle, quotas, e2e non validés |
| Ultimate | Expérimental en TEST | Workspace + composantes Plus | Quota IA et priorité ne peuvent être garantis commercialement |
| Impact, Launch, Flow, Creative, Horizon | Non commercialisés | 5 outils Pro individuels, Devis Studio et brouillon Facturation Pro disponibles séparément | Pas de licences équipes, rôles, données partagées ni quotas multi-utilisateurs |

## Conséquences
- Le catalogue `packs-actifs.html` donne accès à Free, aux parcours de démonstration et aux outils Pro existants.
- Un pack « accessible en TEST » n'est **pas** un pack marchand LIVE actif.
- Aucun prix Stripe LIVE n'a été activé ou créé, aucun achat réel initié.
- La création d'un statut « LIVE » exige une validation réelle des droits client, des événements webhook signés et de l'éligibilité légale du compte marchand.
- Preuves techniques : `advanced-exports.js`, `workspace-insights.js`, `auto-cloud.js`, `plus-lab.js`, `outils-pro.js`, `devis-pro.js`, les tests GitHub `browser-*.mjs`.
- Point non encore prouvé : validation d'un parcours complet avec plusieurs clients réels, y compris renouvellement/annulation/paiements LIVE. On ne déclare donc pas les packs prêts à la vente.

## Règle de révision
Toute activation de fonctionnalité supplémentaire doit se refléter dans le catalogue et les contrôles `tests/check-available-packs.mjs`. Ne jamais présenter un outil local gratuit comme un abonnement Pro collectif livré.
