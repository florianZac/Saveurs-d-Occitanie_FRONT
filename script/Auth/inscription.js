// =======================================================
// Script de la page Inscription : création d'un nouveau compte
// Appelle l'API Symfony POST /api/register
// =======================================================

import { apiRegister } from "../api.js";

/**
 * @description Fonction d'initialisation de la page Inscription
 */
export function initInscriptionPage() {
    // Récupération des éléments du DOM
    const formulaire       = document.getElementById('inscriptionForm');
    const mdpInput         = document.getElementById('mdpInput');
    const mdpConfirmInput  = document.getElementById('mdpConfirmInput');
    const alerte           = document.getElementById('alerteInscription');
    const btnSubmit       = formulaire ? formulaire.querySelector('button[type="submit"]') : null;

    // Sécurité
    if (!formulaire) return;

    /**
     * @description Affiche une alerte Bootstrap (succès ou erreur)
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
     * @description Vérifie que les deux mots de passe correspondent via setCustomValidity
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
    formulaire.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Validation complète avant traitement
        verifierCorrespondanceMdp();
        if (!formulaire.checkValidity()) {
            formulaire.classList.add('was-validated');
            return;
        }

        // Construction du nouveau compte
        // Récupération des valeurs
        // NOTE : pas de sanitize sur le password (préserve les caractères spéciaux)
        // Le backend fait sa propre sanitization et validation
        const payload = {
            email:      sanitizeString(document.getElementById('emailInput').value.trim().toLowerCase()),
            password:   (mdpInput.value),
            lastname:   sanitizeString(document.getElementById('nomInput').value.trim()),
            firstname:  sanitizeString(document.getElementById('prenomInput').value.trim()),
           // role:       "client",  // Par défaut, tout nouveau compte est client
            //adresse:    sanitizeString(document.getElementById('adresseInput').value.trim())
        };

        // Récupération optionnelle de l'adresse si le champ existe dans le formulaire
        const adresseInput = document.getElementById('adresseInput');
        if (adresseInput && adresseInput.value.trim() !== '') {
            payload.adresse = adresseInput.value.trim();
        }

        // Désactivation du bouton pendant la requête
        let textOriginal = '';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            textOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Inscription...';
        }

        try {
            // Appel API : POST /api/register
            await apiRegister(payload);

            // Inscription réussie
            afficherAlerte('Compte créé avec succès ! Redirection vers la connexion...', 'success');
            formulaire.reset();
            formulaire.classList.remove('was-validated');

            // Redirection SPA vers /login après 1,5 seconde
            setTimeout(() => {
                window.history.pushState({}, "", "/login");
                window.dispatchEvent(new Event('popstate'));
            }, 1500);

        } catch (err) {
            // Erreur renvoyée par l'API (email déjà utilisé, mdp trop faible, etc.)
            afficherAlerte(err.message, 'danger');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textOriginal;
            }
        }
    });
}
