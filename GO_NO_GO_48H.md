# Kitora — décision de lancement sur 48 heures

## J0 — bloquants P0
- [x] CI générale et contrôles de livraison au vert (dernier commit contrôlé : 8e10b2e).
- [x] Fonctions LIVE séparées et tables LIVE créées.
- [ ] Confirmer les secrets LIVE depuis le tableau de bord sans les divulguer.
- [ ] Tester un webhook LIVE signé et contrôler son traitement, sa déduplication et les mises à jour d'état.
- [ ] S'assurer que la configuration des accès Premium fonctionne avec un vrai abonnement LIVE.
- [ ] Faire valider par le titulaire les informations commerciales, légales et fiscales pertinentes.

## J1 — qualification client et commercialisation
- [ ] Activer les prix Plus LIVE uniquement après succès des tests P0.
- [ ] Tester Checkout avec un client de recette et une transaction réelle autorisée (sans débiter des tiers à leur insu).
- [ ] Vérifier le parcours page d'offres → panier → paiement → abonnement actif → outil Premium → portail de facturation.
- [ ] Tester l'annulation et le paiement échoué (sans laisser de droits indus).
- [ ] Vérifier les e-mails, le support et l'accessibilité mobile.

## J2 — publication ou décision de repli
- [ ] Tests de navigateur et CI complets tous au vert.
- [ ] Relecture de la PR, fusion puis test de la version publique.
- [ ] Activer la commercialisation uniquement si toutes les étapes critiques sont confirmées.
- [ ] Sinon lancer en démo Free / TEST en annonçant honnêtement que les paiements réels sont fermés.

**Règle : aucune facturation publique tant qu'un achat réel ne délivre pas effectivement le service.**
