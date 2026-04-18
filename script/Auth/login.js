// =======================================================
// Script de la page Login (connexion)
// Appelle l'API Symfony /api/login_check pour obtenir un JWT
// =======================================================

// Import des fonctions nécessaires
import { setCookie, showAndHideElementsForRole, afficherToast } from "../script.js";
import { apiLogin } from "../api.js";

// Nom du cookie contenant le JWT (identique à script.js et api.js)
const TOKEN_COOKIE = "accesstoken";

