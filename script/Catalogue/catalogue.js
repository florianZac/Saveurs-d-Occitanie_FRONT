// =======================================================
// Script de la page Catalogue : récupère les produits via l'API
// Affichage grille + filtres + ajout direct au panier
// =======================================================

// Import des données produits
import { PRODUITS } from "../Produit/produits.js";
// Import du formatage de prix (pour afficher "12,50 €")
// Import des fonctions utilitaires (formatage, ajout panier, sanitize)
// on importe ajouterAuPanier et afficherToast pour l'ajout direct
// depuis la grille du catalogue, ainsi que sanitizeString pour échapper
import { formaterPrix, ajouterAuPanier, afficherToast, sanitizeString } from "../script.js";

/**
 * @description Fonction d'initialisation de la page Catalogue
 * Appelée automatiquement par le Router après injection du HTML
 */
export function initCataloguePage() {
    // Récupération des éléments du DOM créés dans catalogue.html
    const grille              = document.getElementById('grilleProduits');
    const champRecherche      = document.getElementById('rechercheProduit');
    const filtreCategorie     = document.getElementById('filtreCategorie');
    const messageAucunResultat = document.getElementById('aucunResultat');

    // Sécurité : si la page n'est pas celle du catalogue, on sort
    if (!grille) return;

    // Affichage d'un loader pendant le chargement
    grille.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3 text-muted">Chargement du catalogue...</p>
        </div>
    `;

    // Récupération asynchrone des produits via l'API
    let tousProduits = [];
    try {
        tousProduits = await getProduits();
    } catch (err) {
        grille.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <strong>Erreur :</strong> ${sanitizeString(err.message)}
                </div>
            </div>
        `;
        return;
    }


    /**
     * @description Construit le HTML d'une carte produit
     * Ajout : sélecteur de quantité + bouton "Ajouter" inline sur la carte.
     * @param {Object} produit - objet produit
     * @returns {string} HTML de la carte
     */
    function genererCarteProduit(produit) {
        // Indicateur de rupture de stock (utilisé pour désactiver les contrôles)
        const horsStock = produit.stock === 0;
        // Attribut disabled à appliquer si rupture
        const disabledAttr = horsStock ? 'disabled' : '';

        return `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <article class="card carte-produit shadow-sm">
                    <img src="${sanitizeString(produit.image)}" class="card-img-top" alt="${sanitizeString(produit.nom)}" loading="lazy">
                    <div class="card-body d-flex flex-column">
                        <span class="badge badge-categorie align-self-start mb-2">${sanitizeString(produit.libelleCategorie)}</span>
                        <h3 class="card-title h6">${sanitizeString(produit.nom)}</h3>
                        <p class="card-text small text-muted flex-grow-1">${sanitizeString(produit.origine)}</p>

                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="prix">${formaterPrix(produit.prix)}</span>
                            <a href="/produit?id=${produit.id}" class="btn btn-sm btn-outline-primary" aria-label="Voir le détail de ${sanitizeString(produit.nom)}">
                                Voir <i class="bi bi-arrow-right" aria-hidden="true"></i>
                            </a>
                        </div>

                        <div class="d-flex gap-2 mt-3">
                            <label for="qte-cat-${produit.id}" class="visually-hidden">
                                Quantité de ${sanitizeString(produit.nom)}
                            </label>
                            <input type="number"
                                   id="qte-cat-${produit.id}"
                                   class="form-control form-control-sm champ-quantite-catalogue"
                                   data-id-produit="${produit.id}"
                                   value="1" min="1" max="${produit.stock}"
                                   style="width: 70px;"
                                   ${disabledAttr}>
                            <button type="button"
                                    class="btn btn-sm btn-primary flex-grow-1 bouton-ajouter-catalogue"
                                    data-id-produit="${produit.id}"
                                    aria-label="Ajouter ${sanitizeString(produit.nom)} au panier"
                                    ${disabledAttr}>
                                <i class="bi bi-cart-plus" aria-hidden="true"></i>
                                ${horsStock ? 'Rupture' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </article>
            </div>
        `;
    }


    /**
     * @description Filtre les produits selon la recherche et la catégorie,
     * puis met à jour l'affichage.
     */
    function afficherProduits() {
        // Récupération des valeurs des filtres
        const texte = champRecherche.value.trim().toLowerCase();
        const categorie = filtreCategorie.value;

        // Filtrage avec .filter() : on garde uniquement les produits qui matchent
        const produitsFiltres = PRODUITS.filter(p => {
            // Match texte : présent dans le nom OU la description
            const matchTexte = p.nom.toLowerCase().includes(texte)
                            || p.description.toLowerCase().includes(texte);
            // Match catégorie : aucune sélection OU catégorie identique
            const matchCategorie = categorie === '' || p.categorie === categorie;
            // Les deux conditions doivent être vraies
            return matchTexte && matchCategorie;
        });

        // Affichage conditionnel : message ou grille
        if (produitsFiltres.length === 0) {
            grille.innerHTML = '';
            messageAucunResultat.classList.remove('d-none');
        } else {
            messageAucunResultat.classList.add('d-none');
            // .map() crée un tableau de HTML, .join('') le concatène
            grille.innerHTML = produitsFiltres.map(genererCarteProduit).join('');
        }
    }

    // Écouteurs d'événements sur les filtres
    // "input" pour la recherche : réagit à chaque frappe
    champRecherche.addEventListener('input', afficherProduits);
    // "change" pour le select : réagit à chaque sélection
    filtreCategorie.addEventListener('change', afficherProduits);

    // Délégation d'événement sur la grille pour gérer l'ajout au panier
    // Pourquoi déléguer plutôt que d'attacher N listeners ?
    //   - Le HTML de la grille est régénéré à chaque filtrage (innerHTML = ...)
    //     donc tous les listeners attachés directement seraient perdus.
    //   - Un seul listener sur le parent suffit, .closest() retrouve le bon bouton.
    grille.addEventListener('click', (e) => {
        // Recherche du bouton "Ajouter" parent du clic (peut être l'icône ou le bouton)
        const bouton = e.target.closest('.bouton-ajouter-catalogue');
        if (!bouton) return; // Le clic n'est pas sur un bouton ajout, on ignore

        // Récupération de l'ID produit via data-id-produit
        const idProduit = parseInt(bouton.dataset.idProduit, 10);
        // Récupération du champ quantité associé via son id
        const champQuantite = document.getElementById(`qte-cat-${idProduit}`);
        // Conversion en entier
        const quantite = parseInt(champQuantite.value, 10);

        // Validation de la quantité (sécurité)
        if (isNaN(quantite) || quantite < 1) {
            afficherToast('Quantité invalide', 'danger');
            return;
        }

        // Ajout au panier (la fonction affiche déjà un toast de confirmation)
        ajouterAuPanier(idProduit, quantite);
    });

    // Affichage initial (tous les produits)
    afficherProduits();
}
