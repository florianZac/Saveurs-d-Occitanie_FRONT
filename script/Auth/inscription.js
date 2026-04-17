// =======================================================
// Script de la page Inscription : création d'un nouveau compte
// =======================================================

import { enregistrerCompte, sanitizeString } from "../script.js";

/**
 * Fonction d'initialisation de la page Inscription
 */
export function initInscriptionPage() {
    // Récupération des éléments du DOM
    const formulaire       = document.getElementById('inscriptionForm');
    const mdpInput         = document.getElementById('mdpInput');
    const mdpConfirmInput  = document.getElementById('mdpConfirmInput');
    const alerte           = document.getElementById('alerteInscription');

    // Sécurité
    if (!formulaire) return;

    /**
     * Affiche une alerte Bootstrap (succès ou erreur)
     * @param {string} message
     * @param {string} type - "success" ou "danger"
     */
    function afficherAlerte(message, type) {
        // Reset des classes précédentes et application du bon style
        alerte.className = `alert alert-${type}`;
        alerte.textContent = message;
        alerte.classList.remove('d-none');
    }

    /**
     * Vérifie que les deux mots de passe correspondent
     * Utilise l'API HTML5 setCustomValidity pour intégrer la validation Bootstrap
     */
    function verifierCorrespondanceMdp() {
        if (mdpInput.value !== mdpConfirmInput.value) {
            // setCustomValidity : marque le champ comme invalide pour Bootstrap
            mdpConfirmInput.setCustomValidity('mismatch');
        } else {
            // Chaîne vide = champ valide
            mdpConfirmInput.setCustomValidity('');
        }
    }

    // Vérification en temps réel à chaque frappe
    mdpInput.addEventListener('input', verifierCorrespondanceMdp);
    mdpConfirmInput.addEventListener('input', verifierCorrespondanceMdp);

    // Gestion de la soumission du formulaire
    formulaire.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Validation complète avant traitement
        verifierCorrespondanceMdp();
        if (!formulaire.checkValidity()) {
            formulaire.classList.add('was-validated');
            return;
        }

        // Construction du nouveau compte
        // Note : en production, le mot de passe serait envoyé en HTTPS au backend
        // et haché (bcrypt) avant stockage en base
        const nouveauCompte = {
            email:      sanitizeString(document.getElementById('emailInput').value.trim().toLowerCase()),
            motDePasse: sanitizeString(mdpInput.value),
            nom:        sanitizeString(document.getElementById('nomInput').value.trim()),
            prenom:     sanitizeString(document.getElementById('prenomInput').value.trim()),
            role:       "client",  // Par défaut, tout nouveau compte est client
            adresse:    sanitizeString(document.getElementById('adresseInput').value.trim())
        };

        // Tentative d'enregistrement (retourne false si email déjà utilisé)
        const resultat = enregistrerCompte(nouveauCompte);

        if (!resultat) {
            afficherAlerte("Cette adresse email est déjà utilisée.", "danger");
            return;
        }

        // Inscription réussie
        afficherAlerte("Compte créé avec succès ! Redirection vers la page de connexion...", "success");
        formulaire.reset();
        formulaire.classList.remove('was-validated');

        // Redirection SPA vers /login après 1,5 seconde
        setTimeout(() => {
            window.history.pushState({}, "", "/login");
            window.dispatchEvent(new Event('popstate'));
        }, 1500);
    });
}
