# Kitora V1.0 — Spécification produit et brouillons commerciaux
**Statut : BROUILLON NON CONTRACTUEL — ne pas publier comme CGV définitives ni activer les paiements réels.**
Date : 18 octobre 2026.

## Matrice de droits cibles

| Formule | Prix annoncé | Fonctions V1 bêta | À terminer avant vente réelle |
| --- | --- | --- | --- |
| Free | 0 € | Outils locaux avec compte | Recette comptes et données |
| Solo | 1,99 €/mois | Outils Free, exports avancés CSV/Markdown sur Projects, Notes, Agenda, Learn | Étendre les exports à tous les outils pertinents et valider la différenciation |
| Workspace | 3,99 €/mois | Solo, indicateurs avancés, sauvegarde automatique cloud **sur activation manuelle** | Résolution robuste des conflits multi-appareils, synchronisation bidirectionnelle |
| Plus | 5,99 €/mois ou 59,90 €/an | Outils Free, demandes personnalisées, quota 10 documents IA/mois si le moteur est activé | Recette réelle du moteur IA, coût et qualité, politique de quota |
| Ultimate | 8,99 €/mois | Workspace et Plus, quota IA de 30 documents/mois si moteur activé | File de traitement prioritaire mesurable (non encore fournie), SLA défini |

### Limites actuelles
- Le système de sauvegarde auto est une **sauvegarde unidirectionnelle prudente**, pas une synchronisation bidirectionnelle complète. En cas de conflit, il ne restaure pas ou n'écrase pas silencieusement la version distante.
- La priorité de traitement Ultimate n'est pas activée tant qu'une vraie file de tâches serveur avec ordonnanceur n'existe pas.
- Les appels au fournisseur d'IA restent coupés par défaut via `KITORA_GROQ_ENABLED`.
- Tous les abonnements et prix disponibles sont actuellement en environnement Stripe TEST.

## Conditions générales de vente — trame à compléter
**Éléments à compléter par l'exploitant et à faire vérifier par un professionnel compétent avant tout encaissement réel.**

1. **Vendeur** : [RAISON SOCIALE OU IDENTITÉ LÉGALE], [FORME JURIDIQUE], [ADRESSE], [IMMATRICULATION], [NUMÉRO DE TVA SI APPLICABLE], [E-MAIL SUPPORT], [TÉLÉPHONE SI APPLICABLE].
2. **Service** : description vérifiée des outils et droits de chacune des cinq formules, limites techniques, compatibilité navigateurs/appareils, dépendances réseau/IA.
3. **Prix** : prix TTC valides par pays, taxes et frais éventuels, fréquence de renouvellement, réductions éventuelles, justificatif de paiement.
4. **Commande** : validation explicite de l'obligation de paiement, page récapitulative avant confirmation, envoi d'une confirmation sur support durable.
5. **Durée / renouvellement** : date de début, durée du cycle, fréquence, notifications légales de renouvellement à vérifier.
6. **Résiliation** : parcours accessible en ligne, date et conséquences de la résiliation, modalités de confirmation durable.
7. **Rétractation** : informations et formulaire type, vérification des exceptions éventuelles en matière de service numérique et des consentements obligatoires avant toute activation immédiate.
8. **Livraison** : droits d'accès octroyés après paiement vérifié par webhook ; description des éventuels délais de prestation personnalisée.
9. **Réclamations / médiation** : coordonnées, délai de réponse souhaité et médiateur de la consommation à identifier si requis.
10. **Garanties / responsabilité** : conditions conformes au droit de la consommation ; préciser que la disponibilité IA n'est pas garantie en permanence, sans exclure les droits légaux.
11. **Évolution du service / interruption / remboursements** : cas d'usage et procédure à fixer.
12. **Mineurs / capacité à contracter** : politique d'âge et validation juridique du parcours, particulièrement si Kitora est destiné à des élèves.

## Mentions légales — trame
- Éditeur : [ENTITÉ LÉGALE ET REPRÉSENTANT]
- Siège / adresse : [À RENSEIGNER]
- Immatriculation / TVA : [À RENSEIGNER]
- Contact : [À RENSEIGNER]
- Responsable de publication : [À RENSEIGNER]
- Hébergeurs : GitHub Pages (site statique), Supabase (authentification/base/fonctions), Stripe (paiements) ; confirmer les entités contractantes et leurs coordonnées publiables.

## Politique de confidentialité — trame distincte
- Responsable de traitement et contact DPO éventuel : [À RENSEIGNER].
- Catégories : identifiants et e-mail, profils, abonnement et facturation, demandes personnalisées, sauvegardes cloud opt-in, journaux techniques strictement nécessaires.
- Finalités et bases légales : [VENTILER PAR FINALITÉ AVEC CONSEIL RGPD].
- Destinataires : Supabase, Stripe, fournisseur IA si activé, hébergeurs et prestataires strictement nécessaires, selon contrats en vigueur.
- Transferts hors UE : [À DÉCRIRE ET JUSTIFIER AVEC GARANTIES SI APPLICABLE].
- Durées de conservation : [À DÉFINIR PAR CATÉGORIE].
- Exercice des droits, réclamation CNIL, contact : [À RENSEIGNER].
- Cookies / stockage local : expliciter les préférences fonctionnelles, les sauvegardes et la conservation des compteurs de démonstration.
- Une information spécifique doit être donnée avant transmission d'une demande au fournisseur IA.

## Prérequis stricts « GO » paiement réel
1. Identification et capacité légale de l'exploitant, encaissement Stripe live approuvé par la plateforme, informations vendeur complètes.
2. Vérification du compte Stripe de la clé serveur et des webhooks correspondants ; ne pas mixer les deux comptes test existants.
3. Catalogue et droits d'accès parfaitement synchronisés avec les conditions contractuelles.
4. Scénarios testés : achat des cinq prix, webhooks en double et désordonnés, renouvellement, impayé, résiliation, remboursement, changement de formule, double achat, session expirée.
5. Consentement et informations de rétractation, confirmation de commande, factures et taxes validés.
6. Assurance qualité sur les quotas IA, surveillance des coûts et de la génération concurrente ; serveur `KITORA_GROQ_ENABLED` désactivé tant que non validé.
7. Revue sécurité RLS, sauvegardes, audit d'isolation entre deux comptes, protection des mots de passe compromis.
8. Procédure de rollback testée, alertes externes et support opérationnels.

Sources réglementaires à consulter : https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/les-informations-precontractuelles ; https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/e-commerce-les-regles-entre-professionnels-et-consommateurs ; https://www.cnil.fr/fr/informer-les-personnes.
