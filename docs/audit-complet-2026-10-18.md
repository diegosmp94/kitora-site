# Audit transversal Kitora — 18 octobre 2026

## Portée et limites
Inventaire complet de l'arborescence GitHub main (80 entrées, dont 1 dossier), inspection ciblée des scripts critiques, des cinq fonctions Supabase, des onze tables publiques, des politiques RLS et des avis de sécurité/performance. Ceci est un audit statique et de configuration : aucun test navigateur multi-appareil, test de charge ou paiement réel n'a été exécuté. Les scripts Node existants ont été lus mais pas exécutés dans cet environnement.

## Priorité haute
1. Auth : Supabase signale la protection des mots de passe divulgués désactivée. Activer après vérification des paramètres.
2. Gestion utilisateurs : aucune API d'administration des utilisateurs ni journal d'audit complet ; prévoir une Edge Function avec contrôle admin serveur, journal append-only, confirmations, protection du dernier admin et tests d'accès.
3. Offres : les contraintes SQL limitent les abonnements à free/plus_monthly/plus_yearly ; l'offre marketing Free/Solo/Workspace/Plus/Ultimate n'est pas alignée avec les droits backend.
4. IA : generate-plus vérifie l'utilisateur et le Plus actif, mais verify_jwt est désactivé au niveau passerelle (contrôle applicatif existant). Le quota de 10 repose sur un comptage puis une écriture séparée, donc ne garantit pas l'absence de dépassement en cas de concurrence ; prévoir réservation atomique et limites fournisseurs.
5. Stripe : create-checkout refuse les clés autres que sk_test_ ; webhook valide la signature et ne journalise que les commandes test. Tester en sandbox les cycles d'abonnement et les webhooks, sans paiement réel.

## Priorité moyenne
6. Supabase : avertissement multiple_permissive_policies sur catalog_products, orders, subscriber_requests ; optimiser après tests de non-régression RLS. Index catalog_products_status_idx signalé inutilisé ; ne pas supprimer sans mesure.
7. Synchronisation : six modules disposent d'une sauvegarde/restauration manuelle ; pas de résolution des conflits entre appareils ; écrasement confirmé avant restauration.
8. Administration : admin.js et admin-insights.js chargent chacun des jeux de données ; plusieurs listes sont plafonnées à 100/150/200 lignes. Les statistiques de l'interface peuvent ne pas représenter la totalité.
9. Tests : site-smoke vérifie essentiellement existence/liens/balises/syntaxe, pas le fonctionnement navigateur ; les tests 100 profils sont synthétiques et ne mesurent ni conversion ni satisfaction.
10. Dépendances : scripts frontend importent supabase-js depuis CDN avec version majeure @2 ; préférer versions figées et stratégie de mises à jour.
11. Exports locaux : import JSON limité en taille et validation structurelle sommaire ; prévoir validation par schéma de chaque module et contrôle de données sensibles.

## Éléments favorables
- RLS activé sur les onze tables publiques.
- Politiques d'accès individuel sur profils, abonnements et sauvegardes.
- Contrôle serveur des prix Stripe ; signature webhook vérifiée.
- Clés privilégiées non présentes dans les scripts frontend examinés.
- Design partagé via store.css/header.css/footer.css, conservable.
- Tests synthétiques clairement identifiés comme non représentatifs.

## Matrice de validation à exécuter
- Pages : accueil, offres, boutique, panier, compte, atelier, outils, administration ; desktop/mobile, liens, clavier, langues.
- Auth : inscription, connexion, reset, déconnexion, session expirée, isolation multi-comptes.
- RLS : anon, utilisateur A, utilisateur B, admin ; SELECT/INSERT/UPDATE/DELETE.
- Paiement : test checkout, annulation, webhook répété, échec, portail, expiration.
- IA : désactivée, refus non-Plus, quota, double soumission, sortie structurée, export PDF/TXT.
- Données : sauvegarde, restauration, conflit, import malformé, export.
- SEO et performance : Core Web Vitals, Lighthouse, métadonnées, sitemap, robots, images, cache.

## Source des avis
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies
- https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

Aucune mutation de la base, aucun déploiement, aucune activation Stripe live pendant cet audit.
