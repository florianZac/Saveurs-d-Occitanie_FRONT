/**
 * Logique commune à toutes les pages :
 * - gestion du panier (localStorage)
 * - mise à jour du compteur dans le header
 * - utilitaires de formatage
 */

const CLE_PANIER = 'panier_saveurs_occitanie';

/**
 * Récupère le panier depuis localStorage.
 * @returns {Array<{id: number, quantite: number}>} Tableau des articles.
 */
function getPanier() {
    const donnees = localStorage.getItem(CLE_PANIER);
    return donnees ? JSON.parse(donnees) : [];
}

/**
 * Enregistre le panier dans localStorage et met à jour le compteur.
 * @param {Array} panier
 */
function setPanier(panier) {
    localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
    majCompteurPanier();
}

/**
 * Ajoute un produit au panier (ou incrémente sa quantité).
 * @param {number} idProduit
 * @param {number} quantite
 */
function ajouterAuPanier(idProduit, quantite = 1) {
    const panier = getPanier();
    const article = panier.find(item => item.id === idProduit);

    if (article) {
        article.quantite += quantite;
    } else {
        panier.push({ id: idProduit, quantite: quantite });
    }

    setPanier(panier);
    afficherToast('Produit ajouté au panier');
}

/**
 * Met à jour la quantité d'un article. Si 0, supprime l'article.
 * @param {number} idProduit
 * @param {number} nouvelleQuantite
 */
function modifierQuantite(idProduit, nouvelleQuantite) {
    let panier = getPanier();

    if (nouvelleQuantite <= 0) {
        panier = panier.filter(item => item.id !== idProduit);
    } else {
        const article = panier.find(item => item.id === idProduit);
        if (article) {
            article.quantite = nouvelleQuantite;
        }
    }

    setPanier(panier);
}

/**
 * Supprime un produit du panier.
 * @param {number} idProduit
 */
function supprimerDuPanier(idProduit) {
    const panier = getPanier().filter(item => item.id !== idProduit);
    setPanier(panier);
}

/**
 * Vide totalement le panier.
 */
function viderPanier() {
    setPanier([]);
}

/**
 * Met à jour le badge compteur dans la navbar.
 */
function majCompteurPanier() {
    const compteur = document.getElementById('compteurPanier');
    if (!compteur) return;

    const total = getPanier().reduce((acc, item) => acc + item.quantite, 0);
    compteur.textContent = total;
    // Masquer le badge si panier vide (optionnel, pour un rendu plus propre)
    compteur.classList.toggle('d-none', total === 0);
}

/**
 * Formate un prix en euros (format français).
 * @param {number} montant
 * @returns {string}
 */
function formaterPrix(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

/**
 * Affiche un toast Bootstrap temporaire (feedback utilisateur).
 * @param {string} message
 */
function afficherToast(message) {
    // Création dynamique d'un toast en bas à droite
    const conteneur = document.getElementById('conteneurToasts') || creerConteneurToasts();

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-bg-success border-0';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-check-circle-fill" aria-hidden="true"></i> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
        </div>
    `;
    conteneur.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function creerConteneurToasts() {
    const conteneur = document.createElement('div');
    conteneur.id = 'conteneurToasts';
    conteneur.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(conteneur);
    return conteneur;
}

// Mise à jour du compteur au chargement de chaque page
document.addEventListener('DOMContentLoaded', majCompteurPanier);
