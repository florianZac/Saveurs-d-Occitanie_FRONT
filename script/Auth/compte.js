// =======================================================
// Script de la page Mon Compte : profil + historique commandes
// Appelle /api/profile, /api/profile (PUT) et /api/orders/mine
// =======================================================

import { formaterPrix, afficherToast, sanitizeString, signout } from "../script.js";
import { apiGetProfile, apiUpdateProfile, apiGetMyOrders } from "../api.js";

/**
 * Fonction d'initialisation de la page Mon Compte
 */
export function initComptePage() {
    // -------------------------------------------------------
    // Onglet Profil : pré-remplissage des champs + sauvegarde
    // -------------------------------------------------------
    const salutation    = document.getElementById('salutationCompte');
    const formProfil    = document.getElementById('formulaireProfil');
    const profilPrenom  = document.getElementById('profilPrenom');
    const profilNom     = document.getElementById('profilNom');
    const profilEmail   = document.getElementById('profilEmail');
    const profilAdresse = document.getElementById('profilAdresse');

    // Récupération du profil via l'API
    let profil = null;
    try {
        profil = await apiGetProfile();
    } catch (err) {
        // Token expiré ou invalide déconnexion
        afficherToast(err.message, 'danger');
        if (err.message.includes('Session expirée')) {
            setTimeout(() => signout(), 1500);
        }
        return;
    }

    // Pré-remplissage de la salutation
    if (salutation) {
        salutation.textContent = `Bonjour ${profil.firstname}, content de vous revoir !`;
    }

    // Pré-remplissage du formulaire avec les infos du compte
    if (formProfil) {
        profilPrenom.value  = sanitizeString(compte.firstname)  || '';
        profilNom.value     = sanitizeString(compte.lastname)     || '';
        profilEmail.value   = sanitizeString(compte.email)   || '';
        profilAdresse.value = sanitizeString(compte.adresse) || '';

        // Le || '' garantit qu'on ne met jamais "null" dans le champ
        if (profilAdresse) {
            profilAdresse.value = profil.adresse || '';
        }

        // Gestion de la sauvegarde du profil
        formProfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Validation du formulaire
            if (!formProfil.checkValidity()) {
                formProfil.classList.add('was-validated');
                return;
            }

            try {
                // On envoie les 3 champs modifiables dont l'adresse
                // Si le champ adresse est vide, on envoie une chaîne vide qui sera
                // interprétée côté backend comme "effacer l'adresse"
                await apiUpdateProfile({
                    firstname: sanitizeString(profilPrenom.value.trim()),
                    lastname:  sanitizeString(profilNom.value.trim()),
                    adresse:   sanitizeString(profilAdresse ? profilAdresse.value.trim() : null),
                });
                afficherToast('Profil mis à jour avec succès');
            } catch (err) {
                afficherToast('Erreur lors de la mise à jour', 'danger');
            }
        });
    }

    // -------------------------------------------------------
    // Onglet Commandes : affichage en accordéon
    // -------------------------------------------------------
    const aucuneCommande = document.getElementById('aucuneCommande');
    const listeCommandes = document.getElementById('listeCommandes');

    if (!listeCommandes) return;

    // Récupération des commandes via l'API
    let commandes = [];
    try {
        commandes = await apiGetMyOrders();
    } catch (err) {
        afficherToast(err.message, 'danger');
        return;
    }

    // Aucune commande  message spécifique
    if (commandes.length === 0) {
        aucuneCommande.classList.remove('d-none');
        return;
    }

    // Construction de l'accordéon
    // l'API renvoie déjà les commandes triées par date DESC (plus récentes en premier)
    listeCommandes.innerHTML = commandes.map((cmd, idx) => {
        // Formatage de la date (l'API renvoie un ISO 8601)
        const date = new Date(cmd.date).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Lignes d'articles
        const articlesHTML = cmd.items.map(a => `
            <tr>
                <td>${sanitizeString(a.nom)}</td>
                <td class="text-center">${a.quantite}</td>
                <td class="text-end">${formaterPrix(a.prixUnitaire)}</td>
                <td class="text-end fw-semibold">${formaterPrix(a.sousTotal)}</td>
            </tr>
        `).join('');

        // Détermination de la livraison : "Offerte" si 0, sinon montant formaté
        const livraisonAffichee = parseFloat(cmd.fraisLivraison) === 0
            ? 'Offerte'
            : formaterPrix(cmd.fraisLivraison);

        // Badge de statut coloré selon l'état
        const badgesStatut = {
            'en_attente': 'bg-warning',
            'payee': 'bg-info',
            'expediee': 'bg-primary',
            'livree': 'bg-success',
            'annulee': 'bg-danger',
        };
        const badgeClass = badgesStatut[cmd.statut] || 'bg-secondary';
        const libellesStatut = {
            'en_attente': 'En attente',
            'payee': 'Payée',
            'expediee': 'Expédiée',
            'livree': 'Livrée',
            'annulee': 'Annulée',
        };
        const libelleStatut = libellesStatut[cmd.statut] || cmd.statut;

        return `
            <div class="accordion-item">
                <h3 class="accordion-header">
                    <button class="accordion-button ${idx === 0 ? '' : 'collapsed'}"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#cmd-${idx}"
                            aria-expanded="${idx === 0 ? 'true' : 'false'}">
                        <div class="d-flex justify-content-between align-items-center w-100 me-3">
                            <span>
                                <strong>${sanitizeString(cmd.numero)}</strong>
                                <span class="text-muted ms-2">${date}</span>
                                <span class="badge ${badgeClass} ms-2">${libelleStatut}</span>
                            </span>
                            <span class="badge bg-primary">${formaterPrix(cmd.total)}</span>
                        </div>
                    </button>
                </h3>
                <div id="cmd-${idx}"
                     class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}"
                     data-bs-parent="#listeCommandes">
                    <div class="accordion-body">
                        <div class="mb-3">
                            <strong>Livraison à :</strong> ${sanitizeString(cmd.adresseLivraison)}
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Produit</th>
                                        <th class="text-center">Quantité</th>
                                        <th class="text-end">Prix unitaire</th>
                                        <th class="text-end">Sous-total</th>
                                    </tr>
                                </thead>
                                <tbody>${articlesHTML}</tbody>
                            </table>
                        </div>
                        <div class="text-end">
                            <div>Sous-total : <strong>${formaterPrix(cmd.sousTotal)}</strong></div>
                            <div>Livraison : <strong>${livraisonAffichee}</strong></div>
                            <div class="h5 mt-2">Total : <span class="text-primary">${formaterPrix(cmd.total)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

