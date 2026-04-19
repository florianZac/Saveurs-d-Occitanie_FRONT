// =======================================================
// Module API : centralise tous les appels vers le backend Symfony
// Toutes les fonctions retournent une Promise qui résout avec les données
// ou rejette avec une erreur contenant le message à afficher.
// =======================================================

// URL de base de l'API Symfony
// Change cette valeur si ton backend tourne sur un autre port/domaine
export const API_BASE_URL = "http://localhost:8000/api";

// Nom du cookie contenant le JWT
const TOKEN_COOKIE = "accesstoken";

// -------------------------------------------------------
// Utilitaires internes
// -------------------------------------------------------

/**
 * @description Récupère le JWT depuis les cookies
 * Dupliqué de script.js pour éviter une dépendance circulaire
 */
function getToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${TOKEN_COOKIE}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

/**
 * @description Effectue un appel fetch vers l'API et gère les erreurs de façon uniforme.
 * @param {string} endpoint - Chemin relatif à API_BASE_URL (ex: "/products")
 * @param {Object} options - Options fetch (method, body, etc.)
 * @param {boolean} withAuth - Si true, ajoute le header Authorization
 * @returns {Promise<Object>} - Les données JSON de la réponse
 * @throws {Error} - Erreur avec message parsé depuis la réponse
 */
async function apiCall(endpoint, options = {}, withAuth = false) {
    // Construction des headers
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
    };

    // Ajout du token JWT si nécessaire
    if (withAuth) {
        const token = getToken();
        if (!token) {
            throw new Error('Vous devez être connecté pour effectuer cette action.');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Appel fetch
    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (err) {
        // Erreur réseau (API down, CORS, etc.)
        throw new Error('Impossible de contacter le serveur. Vérifiez que l\'API est démarrée.');
    }

    // Cas 204 No Content : pas de corps à parser
    if (response.status === 204) {
        return null;
    }

    // Parsing de la réponse JSON
    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json') || contentType.includes('application/ld+json')) {
        try {
            data = await response.json();
        } catch (err) {
            data = null;
        }
    }

    // Réponse en erreur : on construit un message lisible
    if (!response.ok) {
        // Messages spécifiques selon le status
        if (response.status === 401) {
            // Token expiré ou invalide
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        if (response.status === 403) {
            throw new Error('Vous n\'avez pas les droits pour effectuer cette action.');
        }
        if (response.status === 429) {
            throw new Error('Trop de tentatives. Réessayez dans quelques minutes.');
        }

        // Message d'erreur depuis la réponse API
        let message = 'Une erreur est survenue.';
        if (data) {
            // Symfony : { error: "..." } ou { errors: [...] }
            if (data.error) message = data.error;
            else if (data.errors && Array.isArray(data.errors)) message = data.errors.join(' ');
            // API Platform : { "hydra:description": "..." } ou { detail: "..." }
            else if (data['hydra:description']) message = data['hydra:description'];
            else if (data.detail) message = data.detail;
            else if (data.message) message = data.message;
        }
        throw new Error(message);
    }

    return data;
}

// =======================================================
// Endpoints Authentification
// =======================================================

/**
 * @description Inscription d'un nouveau compte.
 * POST /api/register
 * @param {Object} params - { email, password, firstname, lastname }
 * @returns {Promise<{message: string}>}
 */
export async function apiRegister({ email, password, firstname, lastname }) {
    return apiCall('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstname, lastname }),
    });
}

/**
 * @description Connexion : récupère un JWT en échange d'email/password.
 * POST /api/login_check
 * @param {Object} params - { email, password }
 * @returns {Promise<{token: string}>}
 */
export async function apiLogin({ email, password }) {
    return apiCall('/login_check', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

/**
 * @description Récupère le profil de l'utilisateur connecté.
 * GET /api/profile
 * @returns {Promise<{email, firstname, lastname, roles, createdAt}>}
 */
export async function apiGetProfile() {
    return apiCall('/profile', { method: 'GET' }, true);
}

/**
 * @description Met à jour le profil de l'utilisateur connecté.
 * PUT /api/profile
 * @param {Object} params - { firstname?, lastname? }
 * @returns {Promise<{message: string}>}
 */
export async function apiUpdateProfile({ firstname, lastname }) {
    return apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify({ firstname, lastname }),
    }, true);
}

/**
 * @description Change le mot de passe de l'utilisateur connecté.
 * POST /api/profile/password
 * @param {Object} params - { ancienMdp, nouveauMdp }
 * @returns {Promise<{message: string}>}
 */
export async function apiChangePassword({ ancienMdp, nouveauMdp }) {
    return apiCall('/profile/password', {
        method: 'POST',
        body: JSON.stringify({ ancienMdp, nouveauMdp }),
    }, true);
}

// =======================================================
// Endpoints Produits (catalogue)
// =======================================================

/**
 * @description Récupère la liste de tous les produits.
 * GET /api/products
 * @returns {Promise<Array>} - Liste des produits (format API Platform)
 */
export async function apiGetProducts() {
    const data = await apiCall('/products', { method: 'GET' }, false);
    // API Platform renvoie { "hydra:member": [...] } par défaut
    // ou un tableau direct si on est en mode "jsonld: false"
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data['hydra:member'])) return data['hydra:member'];
    if (data && Array.isArray(data.member)) return data.member;
    return [];
}

/**
 * @description Récupère un produit par son ID.
 * GET /api/products/{id}
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function apiGetProduct(id) {
    return apiCall(`/products/${id}`, { method: 'GET' }, false);
}

// =======================================================
// Endpoints Commandes
// =======================================================

/**
 * @description Crée une commande depuis le panier (checkout).
 * POST /api/orders/checkout
 * @param {Object} params - { adresseLivraison, items: [{productId, quantite}, ...] }
 * @returns {Promise<Object>}
 */
export async function apiCheckout({ adresseLivraison, items }) {
    return apiCall('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({ adresseLivraison, items }),
    }, true);
}

/**
 * @description Récupère l'historique des commandes de l'utilisateur connecté.
 * GET /api/orders/mine
 * @returns {Promise<Array>}
 */
export async function apiGetMyOrders() {
    return apiCall('/orders/mine', { method: 'GET' }, true);
}

// =======================================================
// Endpoints Paiement Stripe
// =======================================================

/**
 * @description Crée une session Stripe Checkout pour une commande existante.
 * POST /api/payment/create-session
 * @param {string} commandeNumero - Numéro de la commande à payer
 * @returns {Promise<{sessionId: string, url: string}>}
 */
export async function apiCreatePaymentSession(commandeNumero) {
    return apiCall('/payment/create-session', {
        method: 'POST',
        body: JSON.stringify({ commandeNumero }),
    }, true);
}