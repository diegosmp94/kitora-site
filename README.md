# Kitora Studio

Site statique Kitora (GitHub Pages), avec authentification et données via Supabase. Les pages de la boutique et le style graphique sont maintenus séparément des moteurs PDF et IA.

## Architecture

- `index.html` : accueil et studio gratuit ; `pdf-kit.js` : exports gratuits.
- `compte.html` et `subscriber-requests.js` : espace utilisateur et demandes Kitora Plus.
- `plus-pdf.js` : conversion des réponses structurées de l'IA en PDF et TXT.
- `boutique-plus.html`, `panier.html`, `cart.js` : parcours d'abonnement de **démonstration Stripe**.
- `admin.html` et `admin.js` : gestion interne.
- Supabase Edge Function `generate-plus` : authentification, vérification de l'abonnement Plus et appel serveur à GroqCloud.

## Configuration serveur

Secrets utilisés par `generate-plus` : `GROQ_API_KEY` et `KITORA_GROQ_ENABLED` (`true` uniquement lorsque le titulaire autorisé a validé les conditions et les quotas). La clé secrète reste dans Supabase ; ne jamais la mettre dans GitHub ni dans un navigateur.

Le projet prévoit un maximum logique de dix analyses générées par utilisateur et par mois. Cela **ne constitue pas une garantie de plafond de facturation ou de contrôle des requêtes concurrentes**. Contrôler les limites réelles du fournisseur.

Les paiements Stripe restent en mode test : aucune activation de paiement réel ne doit être effectuée pendant la maintenance.

## Procédure de vérification manuelle

1. Ouvrir la page d'accueil et vérifier les liens, les langues disponibles et le studio gratuit.
2. Tester un export PDF gratuit avec caractères accentués.
3. Se connecter avec un compte de test, ouvrir `compte.html#demandes-plus`.
4. Vérifier la liste des demandes sans déclencher d'appel IA. Tester les téléchargements d'un résultat déjà enregistré.
5. Pour une demande « cours d'espagnol en deux jours », vérifier que le document parle espagnol et présente deux étapes (et non quatre semaines), avec exemples et exercices corrigés.
6. Contrôler les accents, le retour à la ligne et la pagination du PDF.
7. Vérifier que la déconnexion masque les demandes et que les autres comptes ne peuvent pas consulter ces données.
8. Contrôler le panier et le tunnel Stripe **en mode test uniquement**, sans payer.
9. Vérifier les avertissements de sécurité Supabase (RLS, Auth, fonctions).

## Limites connues

- Les analyses IA déjà mises en cache dans `subscriber_requests.ai_result` restent dans leur ancienne version après une amélioration du prompt. La réécriture de ces résultats est une opération distincte et doit être autorisée.
- Les polices standard jsPDF ne couvrent pas l'intégralité d'Unicode. Le PDF adapte certains caractères hors de cette plage ; le TXT UTF-8 conserve les caractères complets.
- L'affichage d'un bouton de téléchargement ne remplace pas un test réel du PDF dans un navigateur.
- Les éditions des scripts GitHub Pages peuvent être temporairement masquées par le cache du navigateur.

## Sécurité de maintenance

Ne jamais publier les secrets Supabase Service Role, Stripe ou Groq. Ne pas changer les politiques RLS ou les fonctions de paiement sans vérification préalable. Ne jamais activer un paiement réel par accident.

## Expériences ajoutées

- `atelier.html` + `atelier.js` : brief de projet local, copie et export TXT.
- `methodes.html` : ressources pratiques pour apprendre, s'organiser et créer.
- `defi-7-jours.html` + script associé : progression locale d'un défi en sept étapes, à reprendre librement.
- `comparateur.html` + `comparateur.js` : comparaison de trois options sur des critères pondérés, export TXT.
- `focus.html` + `focus.js` : minuterie de concentration et pause, compteur de séances local.
- `plus-lab.html` + `plus-lab.js` : modèles guidés de demandes Plus, avec authentification, contrôle d'abonnement et création via les RLS Supabase.
- `sitemap.xml` et `robots.txt` : découverte des pages publiques.

Les expériences gratuites restent entièrement dans le navigateur, sans appeler Groq ou Stripe. Le Plus Lab n'exécute pas de génération immédiatement : il enregistre la demande afin qu'elle soit retrouvée depuis `compte.html#demandes-plus`. Pour préserver l'apparence, les nouvelles pages reprennent la structure, les couleurs, le bandeau et les cartes de la boutique existante.

### Vérifications à faire après publication

1. Confirmer le rendu responsive de chaque nouveau formulaire sur téléphone et ordinateur.
2. Vérifier qu'un visiteur non connecté ne peut pas soumettre de demande dans le Plus Lab et qu'un abonné Plus actif le peut.
3. Tester les exports UTF-8 et les préférences locales, notamment l'effacement via les boutons Réinitialiser.
4. Tester l'actualisation de GitHub Pages et les liens de l'accueil vers chaque nouvel outil.
5. Vérifier le bon fonctionnement du minuteur après suspension et reprise de l'onglet.

### Contrôle automatisé local

Depuis la racine du dépôt, utiliser `node tests/site-smoke.mjs` (Node.js 18 ou plus récent). Ce test n'utilise aucune API payante et vérifie l'existence des pages, l'équilibre des balises principales, les liens locaux et la syntaxe des scripts des expériences.

## Workspace Kitora — étapes 1 et 2

Cinq espaces gratuits, développés avec les mêmes couleurs, cartes, composants et navigation que la boutique :

- `dashboard.html` + `dashboard.js` : résumé local des projets, notes, étapes du défi, séances Focus, révisions et événements.
- `projects.html` + `projects.js` : projets, tâches, échéances, cases terminées, export TXT et import depuis un brief Atelier enregistré.
- `learn.html` + `learn.js` : flashcards créées par l'utilisateur, quiz avec réponse, validation de mémorisation et export TXT.
- `agenda.html` + `agenda.js` : calendrier mensuel, événements locaux et lecture des échéances créées dans Projects.
- `templates.html` + `templates.js` : six modèles éditables téléchargés en TXT (brief, révision, semaine, compte rendu, création, progression).

Ces fonctionnalités utilisent actuellement `localStorage`. **Elles ne sont pas synchronisées entre appareils ni avec le compte Supabase**, même si une page « Mon espace » propose des liens pour y accéder. Aucun paiement réel et aucun appel supplémentaire à Groq ne sont déclenchés. La confidentialité reste limitée à la sécurité de l'appareil et du navigateur ; les données locales peuvent disparaître si le stockage est effacé. Les exports TXT peuvent servir de sauvegardes manuelles.

### Contrôles de réception

1. Créer un brief Atelier, l'importer dans Projects, ajouter/cocher une tâche puis consulter le résultat sur Dashboard.
2. Ajouter une échéance de projet et vérifier sa lecture dans Agenda ; ajouter et supprimer un événement local.
3. Créer deux cartes Learn, afficher leurs réponses, marquer une carte retenue et contrôler le compteur Dashboard.
4. Télécharger chacun des modèles Templates, puis ouvrir le TXT dans un éditeur compatible UTF-8.
5. Vérifier les liens, le rendu mobile, les cas de stockage local saturé et les exports sur navigateur réel.

## Offres proposées et sauvegarde cloud (phase commerciale)

- `offres.html` : comparaison des formules gratuites et des packs envisagés.
- **Free** : 0 €, outils locaux disponibles actuellement.
- **Solo** : prix envisagé 1,99 €/mois pour un module choisi ; aucune facturation ni droit d'accès activé.
- **Workspace** : prix envisagé 3,99 €/mois pour les modules de productivité et les futures capacités cloud ; non commercialisé.
- **Kitora Plus** : offres existantes 5,99 €/mois et 59,90 €/an, Stripe en démonstration.
- **Ultimate** : prix envisagé 8,99 €/mois, regroupant les modules et Plus ; non commercialisé.

Les packs Solo, Workspace et Ultimate sont des propositions tarifaires uniquement. Ne pas ajouter de Checkout ou d'accès premium tant que la facturation test, les droits et la politique de confidentialité n'ont pas été explicitement validés.

La table `public.kitora_workspace_backup` est réservée aux utilisateurs authentifiés via RLS, limitée aux modules Projects, Agenda, Learn, Notes, Défi et Focus, avec taille de sauvegarde plafonnée. **La synchronisation manuelle est déployée** via `synchronisation.js` et `synchronisation.html` (sauvegarde/restauration de six modules sur demande et après confirmation). Le transfert local JSON reste disponible via `transfert-local.js`. La synchronisation automatique en arrière-plan n'est pas disponible et une validation en navigateur connecté reste nécessaire. Priorités de vérification avant mise en service : séparation entre utilisateurs, conflits, restaurations, stockage maximal et comportement après déconnexion.

## Découverte et mesure de la pertinence

- `decouvrir.html` + `decouvrir.js` : parcours de découverte fondé sur huit besoins. Les recommandations sont locales et ne transmettent aucune donnée.
- `cas-utilisation.html` : huit scénarios d'utilisation illustratifs, pas de témoignages ni résultats de clients.
- `test-audience.html` + `test-audience.js` : outil d'enquête locale pour saisir jusqu'à 100 réponses réelles, puis exporter un CSV. Mesure la pertinence déclarée (« Oui ») et l'intention d'achat déclarée ; les ventes réelles exigent des données de commandes réelles en conformité avec la confidentialité des utilisateurs.
- Objectif indicatif : au moins 75 réponses « Oui » sur un panel de 100 visiteurs diversifiés. Ne pas annoncer ce chiffre comme une conversion ou un résultat atteint sans enquête.
- Test de génération PDF : huit cas fictifs testés avec un moteur jsPDF simulé ; aucune requête Groq ni aucun PDF réel n'ont été générés pendant ce test.

## Étude de besoins, catalogue et tests clients (octobre 2026)

- `trouver-mon-outil.html` et `trouver-mon-outil.js` : questionnaire de 3 choix, recommandations de 3 outils gratuits déjà disponibles. Les retours facultatifs sont conservés **localement**, sans remontée analytique vers le serveur.
- `parcours.html` : quatre parcours correspondant aux études, à la création, aux projets et à l'organisation du quotidien.
- `collection.html` et `collection-outils.js` : catalogue filtrable, basé sur `products.js` ; dix références au total, dont huit gratuites et deux en préparation.
- `produit.html` : fiches produits mises à jour pour diriger les visiteurs vers les outils gratuits propres à chaque référence.
- `etude-clients.html` : feuille d'enquête manuelle pour calculer séparément la reconnaissance déclarée et la conversion d'achats confirmés. Les nombres sont saisis par l'utilisateur et ne représentent pas une mesure automatique du trafic.

### Tests disponibles

- `tests/orientation-100.mjs` : cent profils **synthétiques** (dix intentions, différents degrés d'avancement et préférences). L'évaluation ponctuelle a trouvé au moins une suggestion pertinente dans 100 cas sur 100 et une première suggestion pertinente dans 88 cas sur 100, selon le barème prédéfini. **Ce n'est pas un taux d'achat, un sondage réel, ni une preuve que 100 % des clients se reconnaissent dans le site.**
- `tests/generate-client-products.mjs` : trois exemples de documents clients, avec une bibliothèque PDF simulée ; vérifie la conservation du titre, du contenu, des étapes et de l'export TXT. **Ne remplace pas un rendu visuel complet dans le navigateur.**
- `tests/site-smoke.mjs` : contrôles statiques de liens, structure et scripts.

Un objectif réaliste pour une enquête de 100 personnes est qu'au moins 75 déclarent qu'un outil répond à leur besoin. Le nombre d'achats nécessite des observations réelles de clients et un moyen de comptabiliser les transactions confirmées. Tant que Stripe est en mode démonstration, ne pas assimiler les tentatives de paiement à des ventes réelles. Le design graphique historique reste inchangé et aucun paiement réel n'a été activé durant cette phase.

## Administration — console de pilotage

L'interface `admin.html` conserve les composants et la palette Kitora. Elle comprend désormais quatre onglets : Produits, Commandes, Demandes abonnés et Pilotage. Le module `admin-insights.js` ajoute :

- recherche et filtre par statut pour les listes de produits, commandes et demandes ;
- actualisation à la demande ;
- indicateurs opérationnels (demandes ouvertes, anciennes demandes de plus de sept jours, produits publiés, commandes de démonstration) ;
- exports CSV limités aux enregistrements consultables par l'administrateur ;
- répartition des statuts et montants de commandes de test, sans les présenter comme chiffre d'affaires encaissé ;
- aperçu avant publication d'une fiche produit, et confirmation de publication.

Le module vérifie l'utilisateur connecté et son rôle via `kitora_admins` avant d'interroger Supabase. Les autorisations réelles restent contrôlées par les politiques RLS du serveur. Les consultations sont plafonnées aux enregistrements récents ; les chiffres du panneau Pilotage ne sont **pas** une mesure de trafic, de ventes réelles ni de conversion.

### Tests administrateur nécessaires

1. Confirmer qu'une personne non connectée et un compte standard ne peuvent accéder à aucune donnée administrative.
2. Vérifier les filtres et les compteurs sur chaque onglet avec un compte administrateur autorisé.
3. Tester les exports CSV dans un tableur, notamment les accents et les cellules commençant par des caractères de formule.
4. Prévisualiser et publier une fiche de test, puis vérifier son affichage public dans le catalogue.
5. Vérifier les états vide, erreur réseau et chargement de gros catalogues.
6. Ne pas activer de paiement réel, ni modifier des statuts de commandes côté navigateur.
