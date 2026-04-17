// =======================================================
// Router SPA : gère la navigation et le chargement des pages
// sans rechargement complet du navigateur.
// =======================================================

// Import des dépendances du Router
import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";
// Import des fonctions d'authentification depuis script.js
import { isConnected, showAndHideElementsForRole, getRole } from "../script/script.js";

// Mode debug : si true, affiche les logs de navigation dans la console
const debug = true;

// Route 404 par défaut, utilisée quand l'URL ne correspond à aucune route définie
const route404 = new Route("404", "Page introuvable", "/Pages/404.html", "/", [], false);

// Cache des scripts déjà chargés pour éviter de les ré-injecter inutilement
const loadedScripts = new Set();

// =======================================================
// Récupérer la route correspondant à une URL
// =======================================================
const getRouteByUrl = (url) => {
    // Cas particulier : racine ou index.html  route "/"
    if (url === "/index.html" || url === "") url = "/";
    // Recherche de la route dans le tableau, sinon retourne la route 404
    return allRoutes.find(route => route.url === url) || route404;
};

// =======================================================
// Petite fonction utilitaire : formate l'heure actuelle (HH:MM:SS)
// =======================================================
const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("fr-FR", { hour12: false });
};

// =======================================================
// Fonction principale : charge le contenu de la page demandée
// =======================================================
export const LoadContentPage = async () => {
    // Récupère le chemin actuel (ex: "/catalogue")
    const path = window.location.pathname;
    // Récupère la route associée
    const actualRoute = getRouteByUrl(path);

    // -------------------------------------------------------
    // Vérification des droits d'accès (rôles)
    // -------------------------------------------------------
    const allRolesArray = actualRoute.authorize;

    // Si la route a des restrictions (tableau non vide)
    if (allRolesArray.length > 0) {
        // Cas 1 : route réservée aux déconnectés (ex: login, inscription)
        if (allRolesArray.includes("disconnected")) {
            // Si l'utilisateur est connecté  il ne doit pas voir cette page
            if (isConnected()) {
                // Redirection vers l'accueil
                return navigate("/");
            }
        } else {
            // Cas 2 : route réservée à des rôles spécifiques (client, admin...)
            // Si l'utilisateur n'est pas connecté  redirection login
            if (!isConnected()) {
                return navigate("/login");
            }
            // Récupération du rôle de l'utilisateur
            const roleUser = getRole();
            // Si son rôle n'est pas dans la liste autorisée  redirection accueil
            if (!allRolesArray.includes(roleUser)) {
                return navigate("/");
            }
        }
    }

    // -------------------------------------------------------
    // Chargement du HTML partiel via fetch
    // -------------------------------------------------------
    try {
        // Appel HTTP asynchrone vers le fichier HTML de la route
        const res = await fetch(actualRoute.pathHtml);
        // Si erreur HTTP, on lève une exception
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        // Récupération du contenu HTML sous forme de texte
        const html = await res.text();
        // Injection du HTML dans la zone <main id="main-page">
        document.getElementById("main-page").innerHTML = html;
    } catch (err) {
        // Gestion d'erreur : log console + affichage d'un message
        console.error("Erreur chargement page :", err);
        document.getElementById("main-page").innerHTML = "<h2 class='text-center pt-5'>Erreur de chargement</h2>";
    }

    // -------------------------------------------------------
    // Initialisation des modals Bootstrap présents dans la page
    // -------------------------------------------------------
    document.querySelectorAll('#main-page .modal').forEach(modalEl => {
        new bootstrap.Modal(modalEl);
    });

    // -------------------------------------------------------
    // Chargement dynamique du script JS spécifique à la page
    // -------------------------------------------------------
    // On ne charge un JS que s'il est défini et différent de "/"
    if (actualRoute.pathJS && actualRoute.pathJS.trim() !== "" && actualRoute.pathJS !== "/") {
        // Fonction pour importer le module JS
        const loadScript = () => {
            // Import dynamique : on ajoute ?v=timestamp si reloadJS=true
            // pour forcer le navigateur à recharger le fichier (contourne le cache)
            import(actualRoute.pathJS + (actualRoute.reloadJS ? `?v=${Date.now()}` : ""))
                .then(mod => {
                    // Convention : chaque module expose une fonction init() ou init...()
                    // Si le module exporte "init", on l'appelle directement
                    if (typeof mod.init === 'function') {
                        mod.init();
                    } else {
                        // Sinon on cherche une fonction dont le nom commence par "init"
                        const nomFonction = Object.keys(mod).find(
                            k => typeof mod[k] === 'function' && k.startsWith('init')
                        );
                        // Si trouvée, on l'appelle
                        if (nomFonction) mod[nomFonction]();
                    }
                })
                .catch(err => console.error("Erreur import module JS:", err));
        };

        // Si le script doit être rechargé OU n'a jamais été chargé  on le charge
        if (actualRoute.reloadJS || !loadedScripts.has(actualRoute.pathJS)) {
            loadScript();
            // On mémorise le script pour ne pas le recharger inutilement par la suite
            if (!actualRoute.reloadJS) loadedScripts.add(actualRoute.pathJS);
        } else {
            loadScript();
        }
    }

    // -------------------------------------------------------
    // Mise à jour du titre de la page dans l'onglet
    // -------------------------------------------------------
    document.title = `${actualRoute.title} - ${websiteName}`;

    // Log debug
    if (debug) console.log(`[SPA Router] Navigué vers ${path} à ${getFormattedTime()}`);

    // -------------------------------------------------------
    // Mise à jour de la navbar en fonction du rôle (data-show)
    // -------------------------------------------------------
    if (typeof showAndHideElementsForRole === "function") {
        showAndHideElementsForRole();
    }
};

// =======================================================
// Fonction de navigation SPA : change l'URL et charge la page
// =======================================================
export const navigate = (url) => {
    // pushState : ajoute une entrée dans l'historique du navigateur sans recharger
    window.history.pushState({}, "", url);
    // Charge la nouvelle page
    LoadContentPage();
};

// =======================================================
// Délégation d'événement : capture les clics sur les liens internes
// Permet au routeur SPA d'intercepter TOUS les liens <a href="/..."> automatiquement
// =======================================================
document.addEventListener("click", (event) => {
    // On cherche le <a> parent du clic, s'il commence par "/" (lien interne)
    const link = event.target.closest('a[href^="/"]');
    // Si pas un lien interne, on laisse faire le navigateur
    if (!link) return;

    // Empêche le rechargement complet du navigateur
    event.preventDefault();
    // Navigation SPA via notre Router
    navigate(link.getAttribute("href"));
});

// =======================================================
// Gestion du bouton "retour" du navigateur (flèche précédente)
// =======================================================
window.onpopstate = LoadContentPage;

// Chargement initial de la page quand le Router est chargé
LoadContentPage();
