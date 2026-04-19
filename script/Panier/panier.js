// =======================================================
// Script de la page Panier : affichage, modification, checkout via API + paiement Stripe
// =======================================================

import { getProduitParId } from "../Produit/produits.js";
import {
    getPanier, modifierQuantite, supprimerDuPanier, viderPanier,
    formaterPrix, isConnected, sanitizeString, afficherToast
} from "../script.js";
import { apiCheckout, apiGetProfile, apiCreatePaymentSession } from "../api.js";

const SEUIL_LIVRAISON_OFFERTE = 50;
const FRAIS_LIVRAISON = 5.00;

export async function initPanierPage() {
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

    if (!contenuPanier) return;

    // Détection d'un retour depuis Stripe (?payment=cancelled)
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancelled') {
        afficherToast('Paiement annulé. Votre panier a été conservé.', 'warning');
    }

    async function enrichirPanier() {
        const panier = getPanier();
        const resultats = [];
        const produits = await Promise.all(
            panier.map(item => getProduitParId(item.id).catch(() => null))
        );
        panier.forEach((item, idx) => {
            const produit = produits[idx];
            if (produit) {
                const sousTotalLigne = parseFloat(produit.prix) * item.quantite;
                resultats.push({ produit, quantite: item.quantite, sousTotalLigne });
            }
        });
        return resultats;
    }

    async function afficherPanier() {
        const panier = getPanier();

        if (panier.length === 0) {
            contenuPanier.classList.add('d-none');
            panierVide.classList.remove('d-none');
            return;
        }

        panierVide.classList.add('d-none');
        contenuPanier.classList.remove('d-none');

        lignesPanier.innerHTML = `
            <tr><td colspan="5" class="text-center py-4">
                <div class="spinner-border spinner-border-sm"></div> Chargement...
            </td></tr>
        `;

        const articles = await enrichirPanier();

        let sousTotal = 0;
        const lignesHTML = articles.map(({ produit, quantite, sousTotalLigne }) => {
            sousTotal += sousTotalLigne;
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${sanitizeString(produit.image)}" alt="" class="me-2 rounded" style="width:60px; height:60px; object-fit:cover;">
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
                        <label for="qte-${produit.id}" class="visually-hidden">Quantité de ${sanitizeString(produit.nom)}</label>
                        <input type="number"
                               id="qte-${produit.id}"
                               class="form-control form-control-sm champ-quantite"
                               data-id="${produit.id}"
                               value="${quantite}"
                               min="1"
                               max="${produit.stock}"
                               style="width: 80px;">
                    </td>
                    <td class="fw-semibold">${formaterPrix(sousTotalLigne)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger bouton-supprimer"
                                data-id="${produit.id}"
                                aria-label="Supprimer ${sanitizeString(produit.nom)} du panier">
                            <i class="bi bi-trash" aria-hidden="true"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        lignesPanier.innerHTML = lignesHTML;

        const livraison = sousTotal >= SEUIL_LIVRAISON_OFFERTE ? 0 : FRAIS_LIVRAISON;
        const total = sousTotal + livraison;

        sousTotalEl.textContent = formaterPrix(sousTotal);
        fraisLivraisonEl.textContent = livraison === 0 ? 'Offerte' : formaterPrix(livraison);
        totalEl.textContent = formaterPrix(total);

        if (!isConnected()) {
            infoConnexion.classList.remove('d-none');
        } else {
            infoConnexion.classList.add('d-none');
        }

        attacherEcouteurs();
    }

    function attacherEcouteurs() {
        // Modification de quantité : écoute "change" sur chaque input
        document.querySelectorAll('.champ-quantite').forEach(champ => {
            champ.addEventListener('change', async (e) => {
                const id = parseInt(e.target.dataset.id, 10);
                const nouvelleQuantite = parseInt(e.target.value, 10);
                // Protection contre les valeurs invalides
                if (isNaN(nouvelleQuantite) || nouvelleQuantite < 1) {
                    e.target.value = 1;
                    modifierQuantite(id, 1);
                } else {
                    modifierQuantite(id, nouvelleQuantite);
                }
                // Re-rendu complet pour mettre à jour les sous-totaux
                await afficherPanier();
            });
        });

        // Suppression d'un article
        document.querySelectorAll('.bouton-supprimer').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                supprimerDuPanier(id);
                await afficherPanier();
            });
        });
    }

    // Vider complètement le panier avec demande de confirmation
    btnVider.addEventListener('click', async () => {
        if (confirm('Voulez-vous vraiment vider votre panier ?')) {
            viderPanier();
            await afficherPanier();
        }
    });

    // --- Processus de commande + paiement Stripe ---
    // Validation de la commande via l'API
    btnCommander.addEventListener('click', async () => {
        // Redirection si pas connecté
        if (!isConnected()) {
            // Redirection vers la page de connexion (SPA)
            window.history.pushState({}, "", "/login");
            window.dispatchEvent(new Event('popstate'));
            return;
        }

        // On tente de pré-remplir l'adresse depuis le profil API.
        // Si le profil a une adresse, elle est proposée par défaut dans le prompt.
        // Sinon on propose un placeholder générique.
        let adresseParDefaut = '';
        try {
            const profil = await apiGetProfile();
            adresseParDefaut = profil.adresse || '';
        } catch (err) {
            // Profil non récupérable : on continue avec un placeholder
            adresseParDefaut = '';
        }

        // Si on a une adresse au profil, on la propose directement.
        // Sinon on suggère un format type pour aider l'utilisateur.       
        const adresseProposee = adresseParDefaut || '15 rue des Lilas, 31000 Toulouse';
        const adresseLivraison = prompt("Adresse de livraison :", adresseProposee);
        if (!adresseLivraison || adresseLivraison.trim().length < 5) {
            afficherToast('Adresse invalide, commande annulée.', 'warning');
            return;
        }

        // Préparation du payload pour l'API
        const panier = getPanier();
        const items = panier.map(item => ({
            productId: item.id,
            quantite: item.quantite,
        }));

        // Désactivation du bouton pendant la requête       
        btnCommander.disabled = true;
        const textOriginal = btnCommander.innerHTML;
        btnCommander.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Création commande...';

        try {
            // Étape 1 : créer la commande en BDD (statut "en_attente")
            // Appel API : POST /api/orders/checkout
            const commande = await apiCheckout({
                adresseLivraison: adresseLivraison.trim(),
                items,
            });

            
            btnCommander.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Redirection Stripe...';

            // Étape 2 : créer la session Stripe Checkout
            const session = await apiCreatePaymentSession(commande.numero);

            // Personnalisation du message de confirmation avec le numéro de commande
            if (confirmation) {
                confirmation.innerHTML = `
                    <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                    <strong>Commande validée !</strong> Numéro : ${sanitizeString(commande.numero)}
                    <br>
                    <small>Total : ${formaterPrix(commande.total)}</small>
                    <br>
                    <a href="/compte" class="alert-link">Voir mes commandes</a>
                `;
                confirmation.classList.remove('d-none');
                confirmation.focus();
            }

            afficherToast('Commande enregistrée avec succès !');
            // Étape 3 : vider le panier local (la commande est déjà en BDD)
            viderPanier();


            // Étape 4 : redirection vers Stripe
            // window.location.href : redirection complète du navigateur
            // Le paiement se passe chez Stripe (saisie CB, 3DS, etc.)
            // Stripe redirige ensuite vers l'URL success_url ou cancel_url
            window.location.href = session.url;

        } catch (err) {
            // Erreurs possibles : stock insuffisant, produit supprimé, adresse invalide...
            afficherToast(err.message, 'danger');
            btnCommander.disabled = false;
            btnCommander.innerHTML = textOriginal;
        }
    });
// Affichage initial
    await afficherPanier();
}
