// =======================================================
// Script de la page Panier : affichage, modification, validation
// =======================================================

// Import des données et fonctions
import { getProduitParId } from "../Produit/produits.js";
import {
    getPanier, modifierQuantite, supprimerDuPanier, viderPanier,
    formaterPrix, isConnected, getEmail, enregistrerCommande, sanitizeString
} from "../script.js";

// Constantes commerciales
const SEUIL_LIVRAISON_OFFERTE = 50; // Livraison gratuite dès 50€
const FRAIS_LIVRAISON = 5.00;        // Montant des frais en dessous du seuil

/**
 * Fonction d'initialisation de la page Panier
 */
export function initPanierPage() {
    // Récupération de tous les éléments du DOM
    const contenuPanier   = document.getElementById('contenuPanier');
    const panierVide      = document.getElementById('panierVide');
    const lignesPanier    = document.getElementById('lignesPanier');
    const sousTotalEl     = document.getElementById('sousTotal');
    const fraisLivraisonEl= document.getElementById('fraisLivraison');
    const totalEl         = document.getElementById('totalPanier');
    const btnVider        = document.getElementById('btnViderPanier');
    const btnCommander    = document.getElementById('btnCommander');
    const confirmation    = document.getElementById('confirmation');
    const infoConnexion   = document.getElementById('infoConnexion');

    // Si la page n'est pas chargée, on sort
    if (!contenuPanier) return;

    /**
     * Affiche le contenu du panier et met à jour les totaux
     */
    function afficherPanier() {
        const panier = getPanier();

        // Cas : panier vide
        if (panier.length === 0) {
            contenuPanier.classList.add('d-none');
            panierVide.classList.remove('d-none');
            return;
        }

        // Cas : panier contient des articles
        panierVide.classList.add('d-none');
        contenuPanier.classList.remove('d-none');

        // Calcul du sous-total et construction des lignes HTML
        let sousTotal = 0;
        const lignesHTML = panier.map(item => {
            // Récupération des infos produit à partir de l'ID
            const produit = getProduitParId(item.id);
            // Sécurité : produit supprimé du catalogue
            if (!produit) return '';

            // Calcul du sous-total de la ligne
            const sousTotalLigne = produit.prix * item.quantite;
            sousTotal += sousTotalLigne;

            // Retourne le HTML d'une ligne du tableau
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${produit.image}" alt="${sanitizeString(produit.nom)}" class="me-2 rounded" style="width:60px; height:60px; object-fit:cover;">
                            <div>
                                <a href="/produit?id=${produit.id}" class="text-decoration-none text-dark fw-semibold">
                                    ${sanitizeString(produit.nom)}
                                </a>
                                <div class="small text-muted">${sanitizeString(produit.libelleCategorie)}</div>
                            </div>
                        </div>
                    </td>
                    <td>${formaterPrix(produit.prix)}</td>
                    <td>
                        <label for="qte-${produit.id}" class="visually-hidden">Quantité de ${produit.nom}</label>
                        <input type="number"
                               id="qte-${produit.id}"
                               class="form-control form-control-sm champ-quantite"
                               data-id="${produit.id}"
                               value="${item.quantite}"
                               min="1"
                               max="${produit.stock}"
                               style="width: 80px;">
                    </td>
                    <td class="fw-semibold">${formaterPrix(sousTotalLigne)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger bouton-supprimer"
                                data-id="${produit.id}"
                                aria-label="Supprimer ${produit.nom} du panier">
                            <i class="bi bi-trash" aria-hidden="true"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Injection dans le DOM
        lignesPanier.innerHTML = lignesHTML;

        // Calcul des frais de livraison (offerts dès SEUIL_LIVRAISON_OFFERTE)
        const livraison = sousTotal >= SEUIL_LIVRAISON_OFFERTE ? 0 : FRAIS_LIVRAISON;
        const total = sousTotal + livraison;

        // Mise à jour de l'affichage des montants
        sousTotalEl.textContent = formaterPrix(sousTotal);
        fraisLivraisonEl.textContent = livraison === 0 ? 'Offerte' : formaterPrix(livraison);
        totalEl.textContent = formaterPrix(total);

        // Affichage conditionnel du message "Connectez-vous"
        if (!isConnected()) {
            infoConnexion.classList.remove('d-none');
        } else {
            infoConnexion.classList.add('d-none');
        }

        // Ré-attache les écouteurs sur les nouveaux éléments DOM
        attacherEcouteurs();
    }

    /**
     * Attache les écouteurs sur les champs de quantité et boutons de suppression
     */
    function attacherEcouteurs() {
        // Modification de quantité : écoute "change" sur chaque input
        document.querySelectorAll('.champ-quantite').forEach(champ => {
            champ.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id, 10);
                const nouvelleQuantite = parseInt(e.target.value, 10);

                // Protection contre les valeurs invalides
                if (isNaN(nouvelleQuantite) || nouvelleQuantite < 1) {
                    e.target.value = 1;
                    modifierQuantite(id, 1);
                } else {
                    modifierQuantite(id, nouvelleQuantite);
                }
                // Re-rendu complet (pour mettre à jour les sous-totaux)
                afficherPanier();
            });
        });

        // Suppression d'un article
        document.querySelectorAll('.bouton-supprimer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                supprimerDuPanier(id);
                afficherPanier();
            });
        });
    }

    // Vider complètement le panier (avec demande de confirmation)
    btnVider.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment vider votre panier ?')) {
            viderPanier();
            afficherPanier();
        }
    });

    // Validation de la commande
    btnCommander.addEventListener('click', () => {
        // Vérifier que l'utilisateur est connecté
        if (!isConnected()) {
            // Redirection vers la page de connexion (SPA)
            window.history.pushState({}, "", "/login");
            window.dispatchEvent(new Event('popstate'));
            return;
        }

        // Construction de l'objet commande à enregistrer
        const panier = getPanier();
        let total = 0;
        const articles = panier.map(item => {
            const produit = getProduitParId(item.id);
            const sousTotal = produit.prix * item.quantite;
            total += sousTotal;
            return {
                id: produit.id,
                nom: produit.nom,
                prix: produit.prix,
                quantite: item.quantite,
                sousTotal: sousTotal
            };
        });
        // Frais de livraison finaux
        const livraison = total >= SEUIL_LIVRAISON_OFFERTE ? 0 : FRAIS_LIVRAISON;

        // Enregistrement dans localStorage (cf. script.js)
        enregistrerCommande({
            numero: `CMD-${Date.now()}`,              // Numéro unique basé sur le timestamp
            date: new Date().toISOString(),            // Date ISO pour tri/parsing facile
            email: getEmail(),                         // Rattachement à l'utilisateur
            articles: articles,
            sousTotal: total,
            livraison: livraison,
            total: total + livraison
        });

        // Vider le panier après commande
        viderPanier();
        // Masquer le contenu du panier
        contenuPanier.classList.add('d-none');
        panierVide.classList.add('d-none');
        // Afficher le message de confirmation
        confirmation.classList.remove('d-none');
        // Focus sur le message pour les lecteurs d'écran
        confirmation.focus();
    });

    // Affichage initial
    afficherPanier();
}
