/**
 * Classe Route : représente une route de l'application SPA.
 * Chaque instance de Route définit une page de l'application :
 *   - son URL,
 *   - son titre affiché dans l'onglet,
 *   - le chemin vers son HTML partiel,
 *   - le chemin vers son script JS,
 *   - les rôles autorisés,
 *   - le rechargement forcé du JS ou non.
 */
export default class Route {
    // Constructeur appelé à chaque fois qu'une nouvelle route est créée
    constructor(url, title, pathHtml, pathJS = "", authorize = [], reloadJS = false) {
        // URL de la route (ex: "/catalogue")
        this.url = url;
        // Titre affiché dans l'onglet du navigateur
        this.title = title;
        // Chemin vers le fichier HTML partiel à injecter dans <main id="main-page">
        this.pathHtml = pathHtml;
        // Chemin vers le script JS associé à la page (optionnel)
        this.pathJS = pathJS;
        // Tableau des rôles autorisés à accéder à la page
        this.authorize = authorize;
        // Si true, le script JS est rechargé à chaque visite (utile pour éviter le cache)
        this.reloadJS = reloadJS;
    }
}

/**
 * Convention pour le paramètre "authorize" :
 *   []                  -> accessible par tout le monde (public)
 *   ['disconnected']    -> réservé aux utilisateurs DÉCONNECTÉS (ex: login, inscription)
 *   ['client']          -> réservé aux utilisateurs ayant le rôle "client"
 *   ['admin']           -> réservé aux utilisateurs ayant le rôle "admin"
 *   ['client','admin']  -> réservé aux utilisateurs connectés (client OU admin)
 */
