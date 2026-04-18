// =======================================================
// Script de la page Détail produit
// Récupère un produit via l'API (GET /api/products/{id})
// =======================================================

// Import des données et fonctions nécessaires
import { getProduitParId } from "./produits.js";
import { formaterPrix, ajouterAuPanier, afficherToast, sanitizeString } from "../script.js";

/**
 * @description Fonction d'initialisation de la page Détail produit
 */
export async function initProduitPage() {
    // Récupération des éléments HTML
    const conteneur = document.getElementById('detailProduit');
    const filAriane = document.getElementById('filAriane');
    if (!conteneur) return;

    // Récupération de l'ID du produit dans la query string de l'URL
    // Exemple : /produit?id=3  idProduit = 3
    const parametres = new URLSearchParams(window.location.search);
    const idProduit  = parseInt(parametres.get('id'), 10);

    // Affichage d'un loader pendant le chargement
    conteneur.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
        </div>
    `;

    // Récupération du produit via l'API
    let produit = null;
    try {
        produit = await getProduitParId(idProduit);
    } catch (err) {
        // Mise à jour du fil d'Ariane pour signaler l'erreur
        if (filAriane) filAriane.textContent = 'Introuvable';
        afficherToast(err.message, 'danger');
    }

    // Produit introuvable
    if (!produit) {
        conteneur.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-triangle display-1 text-warning" aria-hidden="true"></i>
                <h2 class="mt-3">Produit introuvable</h2>
                <p>Le produit demandé n'existe pas dans notre catalogue.</p>
                <a href="/catalogue" class="btn btn-primary">
                    <i class="bi bi-arrow-left" aria-hidden="true"></i> Retour à la boutique
                </a>
            </div>
        `;
        if (filAriane) filAriane.textContent = 'Introuvable';
        return;
    }

    // Mise à jour du fil d'Ariane avec le nom du produit
    if (filAriane) filAriane.textContent = produit.nom;

    // Indication de disponibilité stock en cours ou rupture
    const disponibilite = produit.stock > 0
        ? `<span class="text-success"><i class="bi bi-check-circle" aria-hidden="true"></i> En stock (${produit.stock} disponibles)</span>`
        : `<span class="text-danger"><i class="bi bi-x-circle" aria-hidden="true"></i> Rupture de stock</span>`;

    // Génération et injection du HTML du produit
    conteneur.innerHTML = `
        <div class="col-md-6">
            <img src="${sanitizeString(produit.image)}" alt="${sanitizeString(produit.nom)}" class="image-produit-detail shadow-sm">
        </div>
        <div class="col-md-6">
            <span class="badge badge-categorie mb-2">${sanitizeString(produit.libelleCategorie)}</span>
            <h1 class="h2">${sanitizeString(produit.nom)}</h1>
            <p class="prix display-6">${formaterPrix(produit.prix)}</p>
            <p>${sanitizeString(produit.description)}</p>

            <dl class="row small">
                <dt class="col-sm-4">Origine</dt>
                <dd class="col-sm-8">${sanitizeString(produit.origine)}</dd>
                <dt class="col-sm-4">Conditionnement</dt>
                <dd class="col-sm-8">${sanitizeString(produit.poids)}</dd>
                <dt class="col-sm-4">Disponibilité</dt>
                <dd class="col-sm-8">${disponibilite}</dd>
            </dl>

            <div class="row g-2 align-items-end mt-3">
                <div class="col-auto">
                    <label for="quantite" class="form-label">Quantité</label>
                    <input type="number" id="quantite" class="form-control"
                           value="1" min="1" max="${produit.stock}"
                           style="width: 90px;"
                           ${produit.stock === 0 ? 'disabled' : ''}>
                </div>
                <div class="col-auto">
                    <button id="btnAjouter" class="btn btn-primary btn-lg"
                            ${produit.stock === 0 ? 'disabled' : ''}>
                        <i class="bi bi-cart-plus" aria-hidden="true"></i> Ajouter au panier
                    </button>
                </div>
            </div>

            <a href="/catalogue" class="btn btn-link mt-3 ps-0">
                <i class="bi bi-arrow-left" aria-hidden="true"></i> Retour à la boutique
            </a>
        </div>
    `;

    // Gestion du clic sur "Ajouter au panier"
    const btnAjouter = document.getElementById('btnAjouter');
    const champQuantite = document.getElementById('quantite');

    if (btnAjouter) {
        btnAjouter.addEventListener('click', () => {
            // Conversion en entier
            const quantite = parseInt(champQuantite.value, 10);
            // Validation de la quantité
            if (isNaN(quantite) || quantite < 1) {
                afficherToast('Quantité invalide', 'danger');
                return;
            }
            // Ajout au panier (fonction globale de script.js)
            ajouterAuPanier(produit.id, quantite);
        });
    }
}
