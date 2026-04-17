// =======================================================
// Script de la page Modification du mot de passe
// =======================================================

import { getCompteConnecte, mettreAJourCompte, signout } from "../script.js";

/**
 * Fonction d'initialisation de la page Modification du mot de passe
 */
export function initEditPasswordPage() {
    // Récupération des éléments du DOM
    const formulaire  = document.getElementById('editPasswordForm');
    const ancienMdp   = document.getElementById('ancienMdp');
    const nouveauMdp  = document.getElementById('nouveauMdp');
    const confirmMdp  = document.getElementById('confirmMdp');
    const alerte      = document.getElementById('alerteEditPwd');

    // Sécurité : on sort si le formulaire n'est pas chargé
    if (!formulaire) return;

    /**
     * Affiche une alerte Bootstrap
     * @param {string} message
     * @param {string} type - "success" ou "danger"
     */
    function afficherAlerte(message, type) {
        alerte.className = `alert alert-${type}`;
        alerte.textContent = message;
        alerte.classList.remove('d-none');
    }

    /**
     * Vérifie que la nouvelle confirmation correspond au nouveau mot de passe
     */
    function verifierCorrespondance() {
        if (nouveauMdp.value !== confirmMdp.value) {
            confirmMdp.setCustomValidity('mismatch');
        } else {
            confirmMdp.setCustomValidity('');
        }
    }

    // Vérification en temps réel
    nouveauMdp.addEventListener('input', verifierCorrespondance);
    confirmMdp.addEventListener('input', verifierCorrespondance);

    // Gestion de la soumission
    formulaire.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Vérifications avant envoi
        verifierCorrespondance();
        if (!formulaire.checkValidity()) {
            formulaire.classList.add('was-validated');
            return;
        }

        // Récupération du compte actuellement connecté
        const compte = getCompteConnecte();
        if (!compte) {
            afficherAlerte("Session expirée. Reconnectez-vous.", "danger");
            return;
        }

        // Vérification de l'ancien mot de passe
        // (côté client ici : un vrai backend ferait cette vérif côté serveur)
        if (ancienMdp.value !== compte.motDePasse) {
            afficherAlerte("Le mot de passe actuel est incorrect.", "danger");
            ancienMdp.classList.add('is-invalid');
            return;
        }

        // Mise à jour du mot de passe via la fonction centralisée
        const ok = mettreAJourCompte(compte.email, {
            motDePasse: nouveauMdp.value
        });

        if (!ok) {
            afficherAlerte("Une erreur est survenue.", "danger");
            return;
        }

        // Mot de passe modifié avec succès
        afficherAlerte("Mot de passe modifié avec succès ! Vous allez être déconnecté pour des raisons de sécurité.", "success");
        formulaire.reset();
        formulaire.classList.remove('was-validated');

        // Déconnexion automatique après 2 secondes (bonne pratique sécurité)
        setTimeout(() => {
            signout();
        }, 2000);
    });
}
