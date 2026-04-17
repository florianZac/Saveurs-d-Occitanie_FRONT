// =======================================================
// Script de la page Catalogue : affichage grille + filtres
// Appelé par le Router via la convention "init" (voir Router.js)
// =======================================================

// Import des données produits
import { PRODUITS } from "../Produit/produits.js";
// Import du formatage de prix (pour afficher "12,50 €")
import { formaterPrix } from "../script.js";

/**
 * Fonction d'initialisation de la page Catalogue
 * Appelée automatiquement par le Router après injection du HTML
 */
export function initCataloguePage() {
    // Récupération des éléments du DOM créés dans catalogue.html
    const grille            = document.getElementById('grilleProduits');
    const champRecherche    = document.getElementById('rechercheProduit');
    const filtreCategorie   = document.getElementById('filtreCategorie');
    const messageAucunResultat = document.getElementById('aucunResultat');

    // Sécurité : si la page n'est pas celle du catalogue, on sort
    if (!grille) return;

    /**
     * Construit le HTML d'une carte produit
     * @param {Object} produit - objet produit
     * @returns {string} HTML de la carte
     */
    function genererCarteProduit(produit) {
        return `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <article class="card carte-produit shadow-sm">
                    <img src="${produit.image}" class="card-img-top" alt="${produit.nom}" loading="lazy">
                    <div class="card-body d-flex flex-column">
                        <span class="badge badge-categorie align-self-start mb-2">${produit.libelleCategorie}</span>
                        <h3 class="card-title h6">${produit.nom}</h3>
                        <p class="card-text small text-muted flex-grow-1">${produit.origine}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="prix">${formaterPrix(produit.prix)}</span>
                            <!-- Lien vers le détail via query string (?id=X) -->
                            <a href="/produit?id=${produit.id}" class="btn btn-sm btn-primary" aria-label="Voir le détail de ${produit.nom}">
                                Voir <i class="bi bi-arrow-right" aria-hidden="true"></i>
                            </a>
                        </div>
                    </div>
                </article>
            </div>
        `;
    }

    /**
     * Filtre les produits selon la recherche et la catégorie,
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

    // Affichage initial (tous les produits)
    afficherProduits();
}
