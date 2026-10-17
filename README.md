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
