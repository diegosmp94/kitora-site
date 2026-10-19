# Kitora V1 — checklist de recette

Statuts : [x] vérifié sur base de traces/outils ; [ ] non validé. Ne jamais confondre déployé et testé.

## GitHub et déploiement
- [x] Deux workflows de tests définis sur la branche de livraison
- [ ] Derniers workflows tous réussis
- [ ] Relecture PR, fusion et vérification du site public

## UX, performance et accessibilité
- [x] Détection d'un échec WCAG contraste sur l'orientation et le lien de recommandation
- [ ] Correction WCAG validée par test de navigateur
- [ ] Tests mobile, tablette, desktop, navigation clavier et lecteurs d'écran

## Authentification et sécurité
- [x] RLS sur les données applicatives et séparation des abonnements TEST/LIVE
- [ ] Inscription, connexion, réinitialisation de mot de passe et déconnexion testées avec comptes de recette
- [ ] Vérification isolation des données de deux vrais comptes de démonstration
- [ ] Activer et vérifier la protection Supabase Auth contre les mots de passe compromis

## Offres et paiements
- [x] Checkout LIVE, portail LIVE et webhook LIVE déployés côté Supabase
- [ ] Vérifier les secrets LIVE côté serveur sans les divulguer
- [ ] Vérifier les deux tarifs LIVE actifs seulement lorsque le parcours est opérationnel
- [ ] Test Stripe LIVE sécurisé: achat, webhook signé, déduplication, abonnement et droits
- [ ] Tester changement de formule, renouvellement, échec et résiliation
- [ ] Valider le statut juridique, les mentions légales, CGV et confidentialité

## Génération et espaces
- [x] La fonction de génération reconnaît les abonnements TEST/LIVE actifs
- [ ] Génération IA réelle, quotas, files d'attente, exports et téléchargement PDF
- [ ] Espace client: facture, annulation, récupération de création et sauvegarde cloud
- [ ] Administration: contrôles d'accès, audit et opérations utilisateurs

## Décision go/no-go
- [ ] La totalité des tests critiques passent, le support et les alertes sont prêts.
- [ ] Ouverture des paiements LIVE uniquement après un test de bout en bout confirmé.
