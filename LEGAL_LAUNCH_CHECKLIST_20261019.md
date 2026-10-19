# Kitora — Validation juridique avant ouverture commerciale (19 octobre 2026)

**Statut : DOCUMENTS PROVISOIRES — NO-GO pour les paiements LIVE.**
Les pages ont été rédigées sur la base des fonctionnalités observables, mais le statut juridique de l'exploitant, l'identité officielle, la configuration des sous-traitants et les engagements opérationnels ne sont pas documentés. Le dépôt public ne doit pas être présenté comme juridiquement prêt à vendre.

## A. Identité et capacité juridique (bloquant)
- [ ] Responsable légal déclaré par l’exploitant : **M. Sampaio**. Vérifier l’identité juridique complète, sa capacité à représenter l’entité contractante et son habilitation avant tout encaissement.
- [ ] Fournir dénomination légale, forme, adresse professionnelle, SIREN / RCS / RNE si applicable, capital social si société, situation TVA.
- [ ] Fournir une adresse e-mail professionnelle surveillée ET un téléphone de contact ; désigner directeur de la publication.
- [ ] Vérifier et renseigner identité officielle, adresse et téléphone de l'hébergeur technique publiquement requis (GitHub Pages et/ou service d'hébergement retenu).
- [ ] Compléter et publier `mentions-legales.html`.

## B. CGV / consommateurs (bloquant)
- [ ] Confirmer tarifs TTC définitifs et TVA applicable, description exacte des outils vendus, prérequis et limites d'usage.
- [ ] Confirmer la durée, le renouvellement, l'activation, l'annulation, la politique de remboursement conforme et les moyens de support.
- [ ] Désigner et contractualiser un médiateur de la consommation compétent ; publier son nom, adresse et site.
- [ ] Vérifier le parcours commande : information précontractuelle, reconnaissance explicite de l'obligation de payer, consentement/conditions nécessaires et confirmation sur support durable (e-mail ou équivalent adapté).
- [ ] Vérifier les garanties légales de conformité des contenus et services numériques et la politique de mises à jour.
- [ ] Mettre en service et **tester** une fonctionnalité de rétractation en ligne conforme aux règles applicables depuis le 19 juin 2026 : présentation claire, soumission, horodatage et accusé de réception durable ; le modèle de `retractation.html` n'est pas cette fonctionnalité.
- [ ] Tester une résiliation électronique simple et accessible pour les abonnements LIVE, sans exiger de contact manuel hors des cas légaux.

## C. RGPD et cookies (bloquant)
- [ ] Confirmer l'identité et le point de contact RGPD du responsable du traitement.
- [ ] Inventorier données/finalités/bases légales, durées de conservation réelles et politique d'effacement/sauvegardes.
- [ ] Examiner accords de traitement des données, lieux de stockage et transferts éventuels : Supabase, GitHub, Stripe, Groq, CDN éventuels ; renseigner les garanties de transfert hors EEE si applicables.
- [ ] Inventorier les cookies et stockages effectifs via navigateur ; classer essentiels/non essentiels ; mettre en place une interface de consentement préalable, refus et retrait si des traceurs optionnels existent.
- [ ] Vérifier procédure de droit d'accès, d'export, de rectification, suppression, opposition et délai de réponse.
- [ ] Vérifier l'information et les protections adaptées lorsque des mineurs sont concernés.

## D. Technique et paiements (bloquant)
- [ ] Vérifier tous les secrets Stripe LIVE exclusivement dans le serveur ; ne jamais les publier.
- [ ] Tester webhook signé LIVE, déduplication, statut d'abonnement, droits Plus et révocation.
- [ ] Tester paiement réel autorisé, remboursement, échec, renouvellement, accès Premium et annulation avec preuves.
- [ ] Vérifier authentification, isolation multi-comptes et protection des mots de passe compromis dans Supabase Auth.
- [ ] S'assurer que le système de rétractation et le contact SAV réceptionnent les demandes et envoient l'accusé automatiquement.
- [ ] Après revue juridique et validation des étapes précédentes seulement : activer les prix et le parcours LIVE.

## Fichiers légaux mis en place
`juridique.html`, `mentions-legales.html`, `cgv.html`, `cgu.html`, `confidentialite.html`, `cookies.html`, `retractation.html`.

## Références officielles (à confirmer selon activité exacte)
- Service-Public : obligations e-commerce — https://entreprendre.service-public.gouv.fr/vosdroits/F23455
- Service-Public : conditions générales de vente — https://entreprendre.service-public.gouv.fr/vosdroits/F33527
- Service-Public : médiation à la consommation — https://entreprendre.service-public.gouv.fr/vosdroits/F33338
- CNIL : informations RGPD — https://www.cnil.fr/fr/informer-les-personnes
- CNIL : cookies et traceurs — https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi

**Important :** modèle préparatoire, non substitut à une revue personnalisée par un professionnel compétent. Les pages ne doivent jamais donner à croire qu'un formulaire de rétractation fonctionne si sa soumission/confirmation n'a pas été mise en place et testée.

## E. Extensions B2B / Associations (bloquant pour les futurs abonnements collectifs)
- [ ] Déterminer l'entité juridique autorisée à vendre et contracter pour Kitora.
- [ ] Classer correctement particuliers, entreprises et associations : le seul statut d'association ne suffit pas à écarter les droits des consommateurs et certaines petites structures professionnelles peuvent bénéficier de protections légales particulières.
- [ ] Vérifier la rédaction des CGV professionnelles (`cgv-professionnels.html`), la formation du contrat, les limites d'usage et l'exactitude du périmètre vendu.
- [ ] Implémenter un vrai modèle d'organisations : administrateurs, membres, rôles, invitations, isolation des données RLS, départ d'un membre et révocation.
- [ ] Ajouter les contrats, factures, devis et le traitement applicable à la TVA ; vérifier les obligations de facturation électronique B2B en France (réception depuis 09/2026, émission progressivement, et e-reporting B2C).
- [ ] Vérifier prestations, sauvegardes, quotas, tarifs collectifs, support et engagements avant de les mettre en vente.
- [ ] Finaliser le point de contact professionnel : l'export TXT de `solutions.html` est strictement local, ne transmet rien et ne constitue pas un devis.
- [ ] Faire la recette et la séparation TEST/LIVE des abonnements collectifs avant toute offre commerciale.

Références : https://entreprendre.service-public.gouv.fr/vosdroits/F33527 et https://entreprendre.service-public.gouv.fr/vosdroits/F39785.

## F. Facturation Kitora Pro : module de brouillons (NO-GO émission officielle)
- [x] Profil entreprise/association privé dans `kitora_org_profiles`, associé au compte propriétaire et protégé par RLS ; aucun abonnement LIVE créé.
- [x] Préremplissage de l'émetteur, saisie du destinataire, prestations, quantités et prix HT, total TVA/TTC ; génération locale d'un PDF A4 marqué « BROUILLON NON ÉMIS ».
- [ ] Vérifier les données d'entreprise (SIREN/SIRET, situation TVA, forme légale, capital, RCS), mentions des factures, pénalités de retard et adresse de facturation du client ; le format seul ne prouve pas l'exactitude.
- [ ] Mettre en place une séquence de numérotation unique, chronologique et continue côté serveur, sans édition rétroactive de factures définitives, avec archives et piste d'audit.
- [ ] Ajouter les avoirs, acomptes, remises, factures rectificatives, règlements et éventuellement des taux de TVA par ligne selon les opérations, plus les cas internationaux spécifiques.
- [ ] Intégrer une plateforme agréée pour les factures B2B nationales concernées par la réforme française et l'export structuré adapté (ex. Factur-X). Un simple PDF issu du navigateur ne remplace pas la facturation électronique réglementaire.
- [ ] Vérifier les obligations de conservation, de réception e-invoicing, de e-reporting et de gestion RGPD du dossier client selon la structure.
- [ ] Relier le profil professionnel au futur vrai parcours d'abonnement organisation **quand il sera sécurisé et commercialisé** ; actuellement il s'agit uniquement d'un dossier préparatoire.

Références officielles : https://entreprendre.service-public.gouv.fr/vosdroits/F31808 et https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees .

## G. Bibliothèque cloud de brouillons, confidentialité et préparation de l'émission
- [x] Brouillons stockés dans `kitora_invoice_drafts` exclusivement après un clic explicite, avec accès RLS réservé à leur auteur et historisation de la date et de la version.
- [x] Reprise, duplication, suppression et deux états **internes non émis** (Brouillon / À vérifier).
- [x] Vérification de révision à chaque modification et suppression pour limiter les écrasements entre appareils.
- [ ] Valider juridiquement le rôle du responsable du traitement et la relation de sous-traitance, la base juridique, l'information des clients dont les coordonnées sont sauvegardées, les durées réelles de conservation et la purge des sauvegardes.
- [ ] Réaliser une recette multi-utilisateur authentifiée en environnement de préproduction en complément des tests simulés et des politiques RLS.
- [ ] Ajouter un véritable parcours de finalisation uniquement après identification du vendeur, numérotation atomique côté serveur, verrouillage des factures émises, immutabilité des versions et piste d'audit.
- [ ] Traiter les cas de TVA multiples, réductions, autoliquidation, acomptes, avoirs, paiements, devis et mentions particulières selon la nature des opérations.
- [ ] Interfacer une plateforme agréée et un format électronique structuré pour les opérations entrant dans le champ de la réforme ; vérifier les obligations de réception depuis septembre 2026 et d'émission selon la taille de l'entreprise.
- [ ] Ajouter une politique d'archivage réglementaire et des exports comptables conformes. Une bibliothèque de brouillons privés **n'est pas** un archivage fiscal.
