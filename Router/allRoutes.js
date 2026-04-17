// Import de la classe Route depuis le fichier voisin
import Route from "./Route.js";

/**
 * Tableau contenant TOUTES les routes de la SPA.
 * Pour ajouter une nouvelle page, il suffit d'ajouter une instance de Route ici
 * et de créer les fichiers HTML + JS correspondants.
 *
 * Paramètres de Route (dans l'ordre) :
 *   url, title, pathHtml, pathJS, authorize, reloadJS
 */
export const allRoutes = [
    // Page d'accueil : public, aucun JS spécifique
    new Route("/","Accueil","/Pages/home.html","/",[],false),

    // Catalogue des produits : public, JS pour gérer filtres et recherche
    new Route("/catalogue","Boutique","/Pages/Catalogue/catalogue.html","/script/Catalogue/catalogue.js",[],true),

    // Détail d'un produit : public, JS pour récupérer l'ID dans l'URL (?id=X)
    new Route("/produit","Détail produit","/Pages/Produit/produit.html","/script/Produit/produit.js",[],true),

    // Panier : public (on peut consulter son panier sans être connecté)
    new Route("/panier","Mon panier","/Pages/Panier/panier.html","/script/Panier/panier.js",[],true),

    // Contact : public, formulaire avec validation
    new Route("/contact","Contact","/Pages/contact.html","/script/Contact/contact.js",[],true),

    // Login : réservé aux utilisateurs DÉCONNECTÉS (si déjà connecté redirection vers /)
    new Route("/login","Connexion","/Pages/Auth/login.html","/script/Auth/login.js",["disconnected"],true),

    // Inscription : réservée aux utilisateurs DÉCONNECTÉS
    new Route("/inscription","Inscription","/Pages/Auth/inscription.html","/script/Auth/inscription.js",["disconnected"],true),

    // Mon compte : réservée aux utilisateurs connectés (client OU admin)
    new Route("/compte","Mon compte","/Pages/Auth/compte.html","/script/Auth/compte.js",["client","admin"], true),

    // Modification du mot de passe : réservée aux utilisateurs connectés
    new Route("/editPassword", "Modification mot de passe", "/Pages/Auth/editPassword.html", "/script/Auth/editPassword.js", ["client","admin"], true),
];

// Nom du site affiché dans le titre de l'onglet : "Nom de la page - websiteName"
export const websiteName = "Saveurs d'Occitanie";
