// =======================================================
// Script de la page Mon Compte : profil + historique commandes
// =======================================================

import {
    getCompteConnecte, mettreAJourCompte, getEmail,
    getCommandesUtilisateur, formaterPrix, afficherToast,
    sanitizeString
} from "../script.js";

/**
 * Fonction d'initialisation de la page Mon Compte
 */
export function initComptePage() {
    // Récupération du compte actuellement connecté
    const compte = getCompteConnecte();

    // Sécurité : si aucun compte trouvé (cookies effacés manuellement par ex.)
    if (!compte) return;

    // -------------------------------------------------------
    // Onglet Profil : pré-remplissage des champs + sauvegarde
    // -------------------------------------------------------
    const salutation   = document.getElementById('salutationCompte');
    const formProfil   = document.getElementById('formulaireProfil');
    const profilPrenom = document.getElementById('profilPrenom');
    const profilNom    = document.getElementById('profilNom');
    const profilEmail  = document.getElementById('profilEmail');
    const profilAdresse= document.getElementById('profilAdresse');

    // Salutation dynamique avec prénom
    if (salutation) {
        salutation.textContent = `Bonjour ${sanitizeString(compte.prenom)}, content de vous revoir !`;
    }

    // Pré-remplissage du formulaire avec les infos du compte
    if (formProfil) {
        profilPrenom.value  = sanitizeString(compte.prenom)  || '';
        profilNom.value     = sanitizeString(compte.nom)     || '';
        profilEmail.value   = sanitizeString(compte.email)   || '';
        profilAdresse.value = sanitizeString(compte.adresse) || '';

        // Gestion de la sauvegarde du profil
        formProfil.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Validation du formulaire
            if (!formProfil.checkValidity()) {
                formProfil.classList.add('was-validated');
                return;
            }

            // Mise à jour du compte via la fonction centralisée de script.js
            const ok = mettreAJourCompte(compte.email, {
                prenom:  sanitizeString(profilPrenom.value.trim()),
                nom:     sanitizeString(profilNom.value.trim()),
                adresse: sanitizeString(profilAdresse.value.trim())
            });

            // Retour utilisateur via toast
            if (ok) {
                afficherToast('Profil mis à jour avec succès');
            } else {
                afficherToast('Erreur lors de la mise à jour', 'danger');
            }
        });
    }

    // -------------------------------------------------------
    // Onglet Commandes : affichage en accordéon
    // -------------------------------------------------------
    const aucuneCommande = document.getElementById('aucuneCommande');
    const listeCommandes = document.getElementById('listeCommandes');

    if (listeCommandes) {
        // Récupération des commandes de l'utilisateur connecté
        const commandes = getCommandesUtilisateur(getEmail());

        // Si aucune commande, affichage du message vide
        if (commandes.length === 0) {
            aucuneCommande.classList.remove('d-none');
            return;
        }

        // Sinon, on construit un accordéon Bootstrap avec toutes les commandes
        // On inverse l'ordre (les plus récentes en premier) avec .reverse()
        listeCommandes.innerHTML = commandes.reverse().map((cmd, idx) => {
            // Formatage de la date au format français
            const date = new Date(cmd.date).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            // Liste des articles de la commande (tableau HTML)
            const articlesHTML = cmd.articles.map(a => `
                <tr>
                    <td>${sanitizeString(a.nom)}</td>
                    <td class="text-center">${a.quantite}</td>
                    <td class="text-end">${formaterPrix(a.prix)}</td>
                    <td class="text-end fw-semibold">${formaterPrix(a.sousTotal)}</td>
                </tr>
            `).join('');

            // Un bloc d'accordéon par commande
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
                                </span>
                                <span class="badge bg-primary">${formaterPrix(cmd.total)}</span>
                            </div>
                        </button>
                    </h3>
                    <div id="cmd-${idx}"
                         class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}"
                         data-bs-parent="#listeCommandes">
                        <div class="accordion-body">
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
                                <div>Livraison : <strong>${cmd.livraison === 0 ? 'Offerte' : formaterPrix(cmd.livraison)}</strong></div>
                                <div class="h5 mt-2">Total : <span class="text-primary">${formaterPrix(cmd.total)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}
