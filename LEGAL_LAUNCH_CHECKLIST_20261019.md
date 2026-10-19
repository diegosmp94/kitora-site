# Kitora — Validation juridique avant ouverture commerciale (19 octobre 2026)

**Statut : DOCUMENTS PROVISOIRES — NO-GO pour les paiements LIVE.**
Les pages ont été rédigées sur la base des fonctionnalités observables, mais le statut juridique de l'exploitant, l'identité officielle, la configuration des sous-traitants et les engagements opérationnels ne sont pas documentés. Le dépôt public ne doit pas être présenté comme juridiquement prêt à vendre.

## A. Identité et capacité juridique (bloquant)
- [ ] Désigner l'entité ou la personne légalement autorisée à exploiter et facturer Kitora ; vérifier capacité juridique et représentant légal le cas échéant.
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
