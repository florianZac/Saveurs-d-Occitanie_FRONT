# Saveurs d'Occitanie — Boutique en ligne SPA

Projet frontend pour la certification **Développeur Web et Web Mobile (DWWM)**.
Single Page Application (SPA) d'e-commerce proposant des produits du terroir occitan.

L'architecture (Router, `data-show`, SCSS custom, authentification par cookies) et adaptée au contexte e-commerce.

---

## Table des matières

1. [Stack technique](#stack-technique)
2. [Arborescence du projet](#arborescence-du-projet)
3. [Installation et lancement](#installation-et-lancement)
4. [Comptes de démonstration](#comptes-de-démonstration)
5. [Architecture SPA : comment ça marche](#architecture-spa--comment-ça-marche)
6. [Compétences DWWM couvertes](#compétences-dwwm-couvertes)
7. [Description des fonctionnalités](#description-des-fonctionnalités)

---

## Stack technique

| Catégorie | Technologie |
|---|---|
 **HTML5** sémantique (header, nav, main, section, article, footer, aside)
- **CSS3** + variables SCSS (compilé avec Dart Sass) (charte terracotta / ocre / olive)
- **Bootstrap 5.3** (grille responsive, composants, utilitaires)
- **Bootstrap Icons** 1.13
- **JavaScript Vanilla** (aucun framework), modules ES6 (`import` / `export`)
- **Routing**  Router SPA maison (History API)
- **Authentification | Cookies** (`SameSite=Lax`, simulation frontend)
- **localStorage** pour la persistance du panier, historique commandes
- **Outillage** npm (Bootstrap + Sass) 
- **framework** Aucun tout est en JS natif

---
## Fonctionnalités

### Catalogue (`index.html`)
- Grille responsive de 8 produits
- Recherche par nom/description
- Filtrage par catégorie
- Message si aucun résultat

### Détail produit (`produit.html?id=X`)
- Récupération du produit via query string
- Sélection de quantité (contrainte par le stock)
- Ajout au panier avec feedback toast
- Gestion du cas "produit introuvable"

### Panier (`panier.html`)
- Tableau des articles avec miniatures
- Modification de quantité en direct
- Suppression individuelle ou vidage global
- Calcul sous-total / livraison / total
- **Livraison offerte dès 50 €**
- Simulation de validation de commande

### Contact (`contact.html`)
- Champs : nom, prénom, email, téléphone (regex FR), sujet, message
- Compteur de caractères
- Checkbox RGPD obligatoire
- Validation Bootstrap avec messages d'erreur

---

## Arborescence du projet

```
Saveurs d'occitanie/
├── Router/                           # Système de routage SPA
│   ├── Route.js                      # Classe décrivant une route
│   ├── allRoutes.js                  # Liste de toutes les routes de l'appli
│   └── Router.js                     # Moteur de navigation (fetch + History API)
│
├── Pages/                            # Fragments HTML injectés dans <main id="main-page">
│   ├── 404.html                      # Page d'erreur par défaut
│   ├── contact.html                  # Formulaire de contact
│   ├── home.html                     # Accueil (hero + 3 articles)
│   ├── Auth/
│   |   ├── compte.html               # Profil + historique commandes
│   |   ├── editPassword.html         # Modification mot de passe
│   |   ├── inscription.html          # Création de compte
│   |   └── login.html                # Connexion
│   ├── Catalogue/
│   |   └──  catalogue.html           # Grille produits avec filtres
│   ├── Panier/
│   |   └── panier.html               # Validation panier + récap + commande
│   └── Produit/
│       └── produit.html              # Détail produit via ?id=
│
├── script/                           # JavaScript
│   └── script.js                     # auth, panier, comptes, utilitaires
│   ├──── Auth/
│   |      ├── compte.js              # Profil + historique
│   |      ├── editPassword.js        # Changement de mot de passe 
│   |      ├── inscription.js         # Inscription (stocke dans localStorage) 
│   |      └── login.js               # Connexion (pose les cookies) 
│   ├──── Catalogue/
│   |      └──  catalogue.js          # Logique catalogue + filtres
│   ├──── Contact/
│   |      └── contact.js             # Validation formulaire contact
│   ├──── Panier/
│   |      ├──  commun.js             # (panier, compteur, utilitaires)
│   |      └── panier.js              # Données panier
│   └──── Produit/
│          ├── produits.js            # Données produits (simule une API)
│          └── produit.js             # Logique page détail
│
├─── scss/                            # Feuilles de style sources
│   ├── _custom.scss                  # Variables Bootstrap (charte terroir)
│   ├── main.css                      # Généré par sass (à ne pas éditer manuellement)
│   ├── main.css.map                  # Source map (debug)
│   └── main.scss                     # Fichier principal (layout, hero, cartes...) 
│  
├── .gitignore 
├── index.html                    # SPA (header, main, footer, imports) catalogue + recherche/filtre
├── package.json                  # Dépendances npm + scripts sass
└── README.md                     # Ce fichier

---

## Installation et lancement

### 1. Installer les dépendances

```bash
npm install
```

Cela installe Bootstrap 5, Bootstrap Icons et Dart Sass dans `node_modules/`.

### 2. Compiler le SCSS

En mode "watch" (recompile automatiquement à chaque modification) :

```bash
npm run sass
```

Ou build unique :

```bash
npm run build
```

### 3. Lancer un serveur local

Le SPA nécessite un vrai serveur HTTP (les `fetch()` ne fonctionnent pas en `file://`).

**Avec Python :**

```bash
python3 -m http.server 8000
# ou raccourci npm :
npm start
```

**Avec Node :**

```bash
npx http-server -p 8000
```

Ouvrir ensuite `http://localhost:8000` dans le navigateur.

---

## Comptes de démonstration

Deux comptes sont créés automatiquement au premier chargement :

| Rôle | Email | Mot de passe |
|---|---|---|
| Client | `client@test.fr` | `Client123!` |
| Admin | `admin@test.fr` | `Admin123!` |

Vous pouvez aussi créer de nouveaux comptes via la page **Inscription** (stockés en localStorage).

---

## Architecture SPA : comment ça marche

### Principe

Plutôt que de recharger une page HTML complète à chaque clic, le Router :

1. **Intercepte les clics** sur les liens internes (`<a href="/...">`) via délégation d'événement dans `Router.js`.
2. **Change l'URL** dans la barre d'adresse avec `window.history.pushState()`.
3. **Récupère** via `fetch()` le fragment HTML correspondant dans `Pages/`.
4. **Injecte** ce HTML dans `<main id="main-page">`.
5. **Charge dynamiquement** le module JS associé via `import()` et appelle sa fonction `init...()`.

### Définir une nouvelle route

Il suffit d'ajouter une ligne dans `Router/allRoutes.js` :

```js
new Route("/maNouvellePage", "Titre", "/Pages/maNouvellePage.html", "/script/maNouvellePage.js", [], true)
```

Paramètres :
- **url** : chemin de l'URL
- **title** : titre affiché dans l'onglet (`Titre - Saveurs d'Occitanie`)
- **pathHtml** : chemin du fragment HTML à charger
- **pathJS** : chemin du script JS associé (optionnel)
- **authorize** : tableau des rôles autorisés (`[]` = public, `["disconnected"]` = non-connectés, `["client","admin"]` = connectés, `["admin"]` = admins uniquement)
- **reloadJS** : `true` pour forcer le rechargement du JS à chaque visite

### Convention d'initialisation des scripts

Chaque script de page expose une fonction `init...()` (par ex. `initCataloguePage`). Le Router la détecte automatiquement et l'appelle après injection du HTML. Inutile d'ajouter un `DOMContentLoaded` listener.

### Protection des routes (rôles)

Le Router vérifie les droits d'accès avant chaque chargement :
- Si la route est réservée aux déconnectés et que l'utilisateur est connecté → redirection vers `/`
- Si la route nécessite un rôle et que l'utilisateur n'est pas connecté → redirection vers `/login`
- Si le rôle ne correspond pas aux rôles autorisés → redirection vers `/`

### Affichage conditionnel dans la navbar

Les éléments de la navbar utilisent l'attribut `data-show` :
```html
<li data-show="connected">...</li>     <!-- affiché si connecté -->
<li data-show="disconnected">...</li>  <!-- affiché si non-connecté -->
<li data-show="admin">...</li>         <!-- admin uniquement -->
<li data-show="client">...</li>        <!-- client uniquement -->
```

La fonction `showAndHideElementsForRole()` dans `script.js` ajoute/retire la classe `d-none` selon l'état de connexion.

---

## Compétences DWWM couvertes

| Bloc de compétence | Où la voir dans le projet |
|---|---|
| **Maquetter une application** | Structure HTML5 sémantique (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`, `<aside>`) sur toutes les pages |
| **Réaliser une interface utilisateur statique et adaptable** | Grille responsive Bootstrap 5 + media queries dans `main.scss` + variables SCSS personnalisées dans `_custom.scss` |
| **Développer une interface utilisateur dynamique** | Router SPA, filtres catalogue, panier réactif, compteur temps réel, toasts, onglets dynamiques |
| **Réaliser une interface accessible** | `aria-label`, `aria-live="polite"`, `role="alert"`, labels explicites, `visually-hidden`, `focus-visible` contrasté, navigation clavier |
| **Validation des données (formulaires)** | Validation HTML5 + Bootstrap `needs-validation` + regex (téléphone FR, mot de passe fort) + `setCustomValidity` |
| **Gestion de l'authentification** | Cookies `SameSite=Lax`, rôles (client/admin), protection des routes, déconnexion automatique |
| **Persistance côté client** | `localStorage` pour panier, comptes, commandes |
| **Manipulation du DOM** | Création dynamique de cartes produits, lignes de panier, accordéons de commandes |
| **Modularité JavaScript** | Modules ES6 avec `import`/`export`, séparation claire des responsabilités |
| **Intégration Bootstrap** | Navbar, grille, cards, modals, toasts, accordéons, onglets, form validation, icônes |
| **Préparation du déploiement** | `package.json`, scripts npm, `.gitignore`, compilation SCSS |

---

## Description des fonctionnalités

### Page d'accueil (`/`)
Hero avec image d'ambiance, 3 articles de présentation (boutique, circuit court, livraison), liens vers le catalogue.

### Catalogue (`/catalogue`)
- Grille responsive de 8 produits du terroir
- **Recherche** textuelle (par nom ou description)
- **Filtrage** par catégorie (Épicerie, Fromages, Vins, Confiseries)
- Message si aucun résultat

### Détail produit (`/produit?id=X`)
- Récupération de l'ID via la query string
- Affichage photo, description, origine, conditionnement, stock
- Sélection de quantité (plafonnée au stock)
- Ajout au panier avec feedback toast
- Gestion du cas "produit introuvable"

### Panier (`/panier`)
- Tableau des articles avec miniatures
- Modification de quantité en direct (recalcul automatique)
- Suppression individuelle / vidage global (avec confirmation)
- Calcul sous-total / livraison / total
- **Livraison offerte dès 50 €**
- Validation de commande (nécessite d'être connecté)
- Enregistrement de la commande dans l'historique

### Mon compte (`/compte`)
**Accessible aux utilisateurs connectés uniquement (client ou admin)**

Trois onglets :
1. **Mon profil** : modification du prénom, nom, adresse de livraison (email en lecture seule)
2. **Mes commandes** : historique en accordéon, détail de chaque commande avec articles et totaux
3. **Sécurité** : lien vers la page de changement de mot de passe

### Modification du mot de passe (`/editPassword`)
- Vérification de l'ancien mot de passe
- Nouveau mot de passe avec exigences de sécurité (regex : 8+ caractères, 1 majuscule, 1 chiffre, 1 spécial)
- Confirmation du nouveau mot de passe
- Déconnexion automatique après modification (bonne pratique sécurité)

### Authentification (`/login`, `/inscription`)
- Connexion avec feedback visuel sur erreur
- Inscription avec validation complète (email, mot de passe fort, CGU)
- Cookies posés après connexion (`accesstoken`, `role`, `user_email`)
- Redirection automatique vers `/` après connexion
- Déconnexion depuis la navbar (supprime tous les cookies)

### Contact (`/contact`)
- Formulaire avec validation HTML5 + Bootstrap
- Champs : nom, prénom, email, téléphone (regex FR), sujet, message
- Compteur de caractères en direct (max 1000)
- Case RGPD obligatoire
- Message de confirmation après envoi (simulation)

---

## Points d'évolution (vers fullstack Symfony)

Le projet est conçu pour être facilement branché à un backend Symfony :

1. **Remplacer `produits.js`** par des `fetch()` vers une API REST (`/api/produits`, `/api/produits/{id}`).
2. **Authentification JWT** :
   - Dans `login.js`, remplacer la vérification en localStorage par un `POST /api/login_check`.
   - Stocker le JWT dans le cookie `accesstoken` (il y a déjà la plomberie).
   - Dans `script.js`, activer `getInfosUser()` (commenté actuellement) pour valider le token à chaque chargement.
3. **Commandes côté serveur** : remplacer `enregistrerCommande()` par un `POST /api/commandes` sécurisé par le JWT.
4. **Paiement Stripe** : remplacer la simulation dans `panier.js` par l'intégration Stripe Checkout.
5. **Page admin** : ajouter les routes `/admin/produits`, `/admin/commandes` avec `authorize: ["admin"]`.
6. **SCSS** : le projet est déjà en SCSS — il suffit d'enrichir `_custom.scss` pour personnaliser davantage.

La constante `apiBaseUrl` dans `script.js` est prête à recevoir l'URL de ton API.

---

**Projet pédagogique — Avril 2026**
