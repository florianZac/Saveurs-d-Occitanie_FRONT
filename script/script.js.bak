// =======================================================
// Script commun - chargé sur TOUTES les pages de la SPA
// Gère : authentification (cookies), rôles, panier (localStorage),
//        compteur panier, toasts, formatage des prix.
// Adapté du projet Quai Antique pour l'e-commerce.
// =======================================================

// -------------------------------------------------------
// Constantes de configuration
// -------------------------------------------------------

// Nom des cookies utilisés pour l'authentification
const tokenCookieName = "accesstoken";
const roleCookieName  = "role";
const emailCookieName = "user_email";

// Base URL de l'API (à brancher plus tard sur le backend Symfony)
// Exemple : export const apiBaseUrl = "https://api.saveurs-occitanie.fr/api";
export const apiBaseUrl = null;

// Clé du panier dans le localStorage
const CLE_PANIER = 'panier_saveurs_occitanie';

// Clé des comptes utilisateurs simulés (inscrits) dans le localStorage
const CLE_COMPTES = 'comptes_saveurs_occitanie';

// Clé de l'historique des commandes dans le localStorage
const CLE_COMMANDES = 'commandes_saveurs_occitanie';

// =======================================================
// Initialisation globale au chargement du DOM
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
		// Bouton de déconnexion dans la navbar (présent uniquement si connecté)
		const signoutBtn = document.getElementById("signout-btn");
		if (signoutBtn) signoutBtn.addEventListener("click", () => signout());

		// Met à jour l'affichage de la navbar selon le rôle
		showAndHideElementsForRole();
		// Met à jour le badge du compteur panier
		majCompteurPanier();
});

// =======================================================
// Gestion des cookies (fonctions utilitaires)
// =======================================================

/**
 * Récupère la valeur d'un cookie par son nom
 * @param {string} name - Nom du cookie
 * @returns {string|null} Valeur du cookie ou null s'il n'existe pas
 */
export function getCookie(name) {
		// Ajoute un "; " au début pour faciliter le parsing
		const value = `; ${document.cookie}`;
		// Découpe la chaîne autour du nom du cookie
		const parts = value.split(`; ${name}=`);
		// Si deux parties, le cookie existe
		if (parts.length === 2) return parts.pop().split(';').shift();
		return null;
}

/**
 * Crée (ou met à jour) un cookie
 * @param {string} name  - Nom du cookie
 * @param {string} value - Valeur
 * @param {number} days  - Durée de vie en jours
 */
export function setCookie(name, value, days) {
		let expires = "";
		// Calcul de la date d'expiration
		if (days) {
			const date = new Date();
			date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
			expires = "; expires=" + date.toUTCString();
		}
		// path=/ pour que le cookie soit accessible sur tout le site
		// SameSite=Lax pour limiter certains risques CSRF
		// Secure uniquement sur HTTPS
		document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

/**
 * Encode une chaîne en Base64 URL-safe
 * @param {string} str
 * @returns {string}
 */
function base64UrlEncode(str) {
		return btoa(str)
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/, '');
}

/**
 * Décode une chaîne Base64 URL-safe
 * @param {string} str
 * @returns {string}
 */
function base64UrlDecode(str) {
		str = str.replace(/-/g, '+').replace(/_/g, '/');
		while (str.length % 4) str += '=';
		return atob(str);
}

/**
 * Crée un JWT simple contenant le payload et une signature factice.
 * Note : côté front-end, ce mécanisme reste un exemple et ne remplace pas
 * un backend sécurisé avec HTTP-only cookies et validation serveur.
 */
export function createJwtToken(payload, expiresDays = 7) {
		const header = { alg: 'HS256', typ: 'JWT' };
		const now = Math.floor(Date.now() / 1000);
		const jwtPayload = { ...payload, iat: now, exp: now + expiresDays * 24 * 60 * 60 };
		const encodedHeader = base64UrlEncode(JSON.stringify(header));
		const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
		const signature = base64UrlEncode(btoa(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`));
		return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Décode un JWT et retourne son payload si le format est valide.
 * @param {string} token
 * @returns {Object|null}
 */
export function decodeJwtToken(token) {
		if (!token) return null;
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const [header, payload, signature] = parts;
		const expectedSignature = base64UrlEncode(btoa(`${header}.${payload}.${JWT_SECRET}`));
		if (expectedSignature !== signature) return null;
		try {
			return JSON.parse(base64UrlDecode(payload));
		} catch (err) {
			return null;
		}
}

/**
 * Vérifie que le JWT est présent et valide (signature + expiration).
 * @param {string} token
 * @returns {boolean}
 */
export function verifyJwtToken(token) {
		const payload = decodeJwtToken(token);
		return payload && payload.exp && payload.exp > Math.floor(Date.now() / 1000);
}

/**
 * Escape les caractères dangereux pour éviter l'injection HTML.
 * @param {string} value
 * @returns {string}
 */
export function sanitizeString(value) {
		if (value === null || value === undefined) return '';
		return String(value)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/\//g, '&#x2F;');
}

/**
 * Supprime un cookie (en le vidant avec une date d'expiration passée)
 * @param {string} name
 */
export function eraseCookie(name) {
		// On essaie plusieurs chemins pour être sûr de supprimer le cookie
		const paths = ["/", "/Pages/Auth", "/script"];
		for (const path of paths) {
				document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
		}
}

// =======================================================
// Authentification
// =======================================================

/**
 * Vérifie si l'utilisateur est connecté (présence du cookie token)
 * @returns {boolean}
 */
export function isConnected() {
		const token = getCookie(tokenCookieName);
		return verifyJwtToken(token);
}

/**
 * Récupère le rôle de l'utilisateur ("client" ou "admin")
 * @returns {string|null}
 */
export function getRole() {
		const token = getCookie(tokenCookieName);
		const payload = decodeJwtToken(token);
		return payload ? payload.role : null;
}

/**
 * Récupère l'email de l'utilisateur connecté
 * @returns {string|null}
 */
export function getEmail() {
		const token = getCookie(tokenCookieName);
		const payload = decodeJwtToken(token);
		return payload ? payload.email : null;
}

// =======================================================
// Affichage dynamique de la navbar selon le rôle
// Cherche tous les éléments avec l'attribut data-show et les
// affiche/masque selon la valeur (disconnected, connected, admin, client)
// =======================================================
export function showAndHideElementsForRole() {
		const userConnected = isConnected();
		const role = getRole();
		// Sélection de tous les éléments porteurs de l'attribut data-show
		const allElements = document.querySelectorAll('[data-show]');

		for (const el of allElements) {
				// On enlève d'abord toute classe d-none (reset)
				el.classList.remove("d-none");
				// On masque selon la règle
				switch (el.dataset.show) {
						case 'disconnected':
								// Masqué si connecté (ex : lien "Connexion")
								if (userConnected) el.classList.add("d-none");
								break;
						case 'connected':
								// Masqué si déconnecté (ex : lien "Mon compte", bouton déconnexion)
								if (!userConnected) el.classList.add("d-none");
								break;
						case 'admin':
								// Visible uniquement par les admins connectés
								if (!userConnected || role !== "admin") el.classList.add("d-none");
								break;
						case 'client':
								// Visible uniquement par les clients connectés
								if (!userConnected || role !== "client") el.classList.add("d-none");
								break;
				}
		}
}

// =======================================================
// Déconnexion
// =======================================================
export function signout() {
		// Suppression des cookies connus
		eraseCookie(tokenCookieName);
		eraseCookie(roleCookieName);
		eraseCookie(emailCookieName);

		// Suppression de tous les cookies résiduels (sécurité)
		const cookies = document.cookie.split(";");
		for (const c of cookies) {
				const eqPos = c.indexOf("=");
				const name = eqPos > -1 ? c.slice(0, eqPos).trim() : c.trim();
				if (name) {
						document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
				}
		}

		// Mise à jour visuelle de la navbar
		showAndHideElementsForRole();

		// Redirection SPA vers l'accueil (sans rechargement complet)
		globalThis.history.pushState({}, "", "/");
		// Déclenche popstate pour forcer le Router à recharger la page
		globalThis.dispatchEvent(new Event('popstate'));
}

// =======================================================
// Gestion des comptes utilisateurs (simulation sans backend)
// Les comptes sont stockés dans localStorage pour l'exercice.
// Dans un vrai projet, ces fonctions feraient des appels API.
// =======================================================

/**
 * Récupère la liste des comptes inscrits (avec quelques comptes de démo)
 * @returns {Array}
 */
export function getComptes() {
		// Récupération depuis localStorage
		const donnees = localStorage.getItem(CLE_COMPTES);
		if (donnees) return JSON.parse(donnees);

		// Comptes de démonstration si la base est vide
		// Dans un vrai projet, les mots de passe seraient HACHÉS côté backend
		const comptesParDefaut = [
				{
						email: "client@test.fr",
						motDePasse: "Client123!",
						nom: "Martin",
						prenom: "Jean",
						role: "client",
						adresse: "15 rue des Lilas, 31000 Toulouse"
				},
				{
						email: "admin@test.fr",
						motDePasse: "Admin123!",
						nom: "Dupont",
						prenom: "Sophie",
						role: "admin",
						adresse: "1 place du Capitole, 31000 Toulouse"
				}
		];
		localStorage.setItem(CLE_COMPTES, JSON.stringify(comptesParDefaut));
		return comptesParDefaut;
}

/**
 * Enregistre un nouveau compte (inscription)
 * @param {Object} compte
 * @returns {boolean} true si OK, false si email déjà utilisé
 */
export function enregistrerCompte(compte) {
		const comptes = getComptes();
		// Vérifie si l'email existe déjà
		if (comptes.some(c => c.email === compte.email)) {
				return false;
		}
		// Ajout du nouveau compte
		comptes.push(compte);
		localStorage.setItem(CLE_COMPTES, JSON.stringify(comptes));
		return true;
}

/**
 * Met à jour un compte existant (pour changement de mot de passe, adresse...)
 * @param {string} email
 * @param {Object} modifications
 */
export function mettreAJourCompte(email, modifications) {
		const comptes = getComptes();
		// Recherche du compte par email
		const index = comptes.findIndex(c => c.email === email);
		if (index === -1) return false;
		// Fusion des modifications avec l'existant
		comptes[index] = { ...comptes[index], ...modifications };
		localStorage.setItem(CLE_COMPTES, JSON.stringify(comptes));
		return true;
}

/**
 * Retourne le compte actuellement connecté (ou null)
 */
export function getCompteConnecte() {
		const email = getEmail();
		if (!email) return null;
		return getComptes().find(c => c.email === email) || null;
}

// =======================================================
// Gestion du panier (localStorage)
// =======================================================

/**
 * Récupère le contenu du panier depuis localStorage
 * @returns {Array<{id:number, quantite:number}>}
 */
export function getPanier() {
		const donnees = localStorage.getItem(CLE_PANIER);
		// Si pas de données, retourne un tableau vide
		return donnees ? JSON.parse(donnees) : [];
}

/**
 * Enregistre le panier dans localStorage et met à jour le compteur
 * @param {Array} panier
 */
export function setPanier(panier) {
		localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
		majCompteurPanier();
}

/**
 * Ajoute un produit au panier (ou incrémente sa quantité si déjà présent)
 * @param {number} idProduit
 * @param {number} quantite
 */
export function ajouterAuPanier(idProduit, quantite = 1) {
		const panier = getPanier();
		// Recherche du produit dans le panier
		const article = panier.find(item => item.id === idProduit);

		if (article) {
				// Déjà présent : on additionne les quantités
				article.quantite += quantite;
		} else {
				// Nouveau : on ajoute un article
				panier.push({ id: idProduit, quantite: quantite });
		}

		setPanier(panier);
		afficherToast('Produit ajouté au panier');
}

/**
 * Modifie la quantité d'un article (suppression si <= 0)
 * @param {number} idProduit
 * @param {number} nouvelleQuantite
 */
export function modifierQuantite(idProduit, nouvelleQuantite) {
		let panier = getPanier();

		if (nouvelleQuantite <= 0) {
				// Quantité nulle ou négative : on retire l'article du panier
				panier = panier.filter(item => item.id !== idProduit);
		} else {
				// Modification de la quantité
				const article = panier.find(item => item.id === idProduit);
				if (article) article.quantite = nouvelleQuantite;
		}

		setPanier(panier);
}

/**
 * Supprime un produit du panier
 * @param {number} idProduit
 */
export function supprimerDuPanier(idProduit) {
		const panier = getPanier().filter(item => item.id !== idProduit);
		setPanier(panier);
}

/**
 * Vide complètement le panier
 */
export function viderPanier() {
		setPanier([]);
}

/**
 * Met à jour le badge du compteur panier dans la navbar
 */
export function majCompteurPanier() {
		const compteur = document.getElementById('compteurPanier');
		if (!compteur) return;

		// Somme de toutes les quantités du panier
		const total = getPanier().reduce((acc, item) => acc + item.quantite, 0);
		compteur.textContent = total;
		// Masque le badge si le panier est vide (plus propre visuellement)
		compteur.classList.toggle('d-none', total === 0);
}

// =======================================================
// Gestion des commandes (historique des achats par utilisateur)
// =======================================================

/**
 * Enregistre une commande passée
 * @param {Object} commande
 */
export function enregistrerCommande(commande) {
		const commandes = getCommandes();
		commandes.push(commande);
		localStorage.setItem(CLE_COMMANDES, JSON.stringify(commandes));
}

/**
 * Récupère toutes les commandes (tous utilisateurs confondus)
 */
export function getCommandes() {
		const donnees = localStorage.getItem(CLE_COMMANDES);
		return donnees ? JSON.parse(donnees) : [];
}

/**
 * Récupère uniquement les commandes d'un utilisateur (par email)
 * @param {string} email
 */
export function getCommandesUtilisateur(email) {
		return getCommandes().filter(c => c.email === email);
}

// =======================================================
// Utilitaires divers
// =======================================================

/**
 * Formate un prix en euros (format français : "12,50 €")
 * @param {number} montant
 * @returns {string}
 */
export function formaterPrix(montant) {
		return new Intl.NumberFormat('fr-FR', {
				style: 'currency',
				currency: 'EUR'
		}).format(montant);
}

/**
 * Affiche un toast Bootstrap temporaire en bas à droite
 * @param {string} message - Texte à afficher
 * @param {string} type    - Type Bootstrap : success, danger, warning, info
 */
export function afficherToast(message, type = 'success') {
		// On crée le conteneur de toasts s'il n'existe pas déjà
		const conteneur = document.getElementById('conteneurToasts') || creerConteneurToasts();

		// Création de l'élément toast
		const toastEl = document.createElement('div');
		toastEl.className = `toast align-items-center text-bg-${type} border-0`;
		toastEl.setAttribute('role', 'alert');
		toastEl.setAttribute('aria-live', 'assertive');
		toastEl.setAttribute('aria-atomic', 'true');
		// Contenu du toast (icône + message + bouton fermer)
		toastEl.innerHTML = `
			<div class="d-flex">
				<div class="toast-body">
					<i class="bi bi-check-circle-fill" aria-hidden="true"></i> ${sanitizeString(message)}
				</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
			</div>
		`;
		conteneur.appendChild(toastEl);

		// Instanciation Bootstrap du toast (auto-masqué après 2,5s)
		const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
		toast.show();
		// Suppression du DOM une fois masqué
		toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Crée le conteneur qui accueille tous les toasts (en bas à droite)
 */
function creerConteneurToasts() {
		const conteneur = document.createElement('div');
		conteneur.id = 'conteneurToasts';
		conteneur.className = 'toast-container position-fixed bottom-0 end-0 p-3';
		document.body.appendChild(conteneur);
		return conteneur;
}
