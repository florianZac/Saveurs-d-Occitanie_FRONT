// =======================================================
// Script de la page Login (connexion)
// Vérifie les identifiants et pose les cookies d'authentification
// Authentification simulée via localStorage (pas d'API backend ici)
// =======================================================

// Import des fonctions nécessaires
// "../script.js" car on est dans /script/Auth/
import {
    setCookie, showAndHideElementsForRole, getComptes, afficherToast,
    createJwtToken, sanitizeString
} from "../script.js";

const tokenCookieName = "accesstoken";

/**
 * Fonction d'initialisation de la page Login
 * Appelée automatiquement par le Router
 */
export function initLoginPage() {
    // Récupération des éléments du DOM
    const loginForm     = document.getElementById("loginForm");
    const mailInput     = document.getElementById("EmailInput");
    const passwordInput = document.getElementById("PasswordInput");
    const togglePassword = document.getElementById("togglePassword");
    const btnLogin      = document.getElementById("btnLogin");
    const erreurLogin   = document.getElementById("erreurLogin");

    // Sécurité : on sort si le formulaire n'existe pas
    if (!loginForm) return;

    /**
     * Fonction qui vérifie les identifiants
     * Dans un vrai projet, elle ferait un appel fetch() vers l'API
     */
    function verifierIdentifiants(event) {
        // Empêche le rechargement de la page
        event.preventDefault();

        // Récupération et sanitation des valeurs saisies
        const email = sanitizeString(mailInput.value.trim().toLowerCase());
        const motDePasse = sanitizeString(passwordInput.value);

        // Validation basique
        if (!email || !motDePasse) {
            afficherErreur("Veuillez remplir tous les champs.");
            return;
        }

        // -----------------------------------------------
        // Simulation d'authentification (en attendant un backend)
        // On cherche le compte dans la liste stockée en localStorage
        // -----------------------------------------------
        const comptes = getComptes();
        const compte = comptes.find(c =>
            c.email === email && c.motDePasse === motDePasse
        );

        // Identifiants incorrects
        if (!compte) {
            afficherErreur("Email ou mot de passe incorrect.");
            // Marquer les champs comme invalides (style Bootstrap)
            mailInput.classList.add("is-invalid");
            passwordInput.classList.add("is-invalid");
            return;
        }

        // -----------------------------------------------
        // Authentification OK : création du JWT côté client
        // -----------------------------------------------
        const token = createJwtToken({
            email: compte.email,
            role: compte.role,
            prenom: compte.prenom
        }, 7);

        setCookie(tokenCookieName, token, 7);  // 7 jours

        // Mise à jour visuelle de la navbar
        showAndHideElementsForRole();

        // Notification utilisateur
        afficherToast(`Connecté en tant que ${compte.prenom} !`);

        // Redirection SPA vers l'accueil après connexion
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new Event('popstate'));
    }

    /**
     * Affiche le bloc d'erreur avec un message
     */
    function afficherErreur(message) {
        erreurLogin.textContent = message;
        erreurLogin.classList.remove("d-none");
    }

    // Écouteur : soumission du formulaire (touche Entrée ou bouton)
    loginForm.addEventListener("submit", verifierIdentifiants);

    // Afficher / masquer le mot de passe
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            togglePassword.innerHTML = isPassword
                ? '<i class="bi bi-eye-slash" aria-hidden="true"></i>'
                : '<i class="bi bi-eye" aria-hidden="true"></i>';
            togglePassword.setAttribute("aria-label", isPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
        });
    }
}
