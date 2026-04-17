// =======================================================
// Script de la page Contact : validation formulaire + envoi simulé
// =======================================================

import { sanitizeString } from "../script.js";

/**
 * Fonction d'initialisation de la page Contact
 */
export function initContactPage() {
    // Récupération des éléments du DOM
    const formulaire       = document.getElementById('formulaireContact');
    const champMessage     = document.getElementById('message');
    const compteurMessage  = document.getElementById('compteurMessage');
    const confirmation     = document.getElementById('messageConfirmation');

    // Si la page n'est pas chargée, on sort
    if (!formulaire) return;

    // Compteur de caractères : mis à jour à chaque frappe
    champMessage.addEventListener('input', () => {
        compteurMessage.textContent = champMessage.value.length;
    });

    // Gestion de la soumission du formulaire
    formulaire.addEventListener('submit', (e) => {
        // Empêche le rechargement de la page
        e.preventDefault();
        e.stopPropagation();

        // Validation Bootstrap : checkValidity() vérifie tous les attributs HTML5
        // (required, minlength, pattern, type="email", etc.)
        if (!formulaire.checkValidity()) {
            // Ajoute la classe was-validated pour afficher les messages d'erreur
            formulaire.classList.add('was-validated');
            // Focus sur le premier champ invalide (accessibilité)
            const premierInvalide = formulaire.querySelector(':invalid');
            if (premierInvalide) premierInvalide.focus();
            return;
        }

        // Simulation d'envoi : dans un vrai projet, on ferait un fetch() vers une API
        // Exemple :
        //   fetch(apiBaseUrl + "/contact", {
        //       method: "POST",
        //       headers: { "Content-Type": "application/json" },
        //       body: JSON.stringify(donnees)
        //   })
        const donnees = {
            nom:       sanitizeString(document.getElementById('nom').value),
            prenom:    sanitizeString(document.getElementById('prenom').value),
            email:     sanitizeString(document.getElementById('email').value),
            telephone: sanitizeString(document.getElementById('telephone').value),
            sujet:     sanitizeString(document.getElementById('sujet').value),
            message:   sanitizeString(document.getElementById('message').value)
        };
        // Log console pour démonstration (à remplacer par l'appel API)
        console.log('Données du formulaire :', donnees);

        // Affichage du message de confirmation
        confirmation.classList.remove('d-none');
        // Réinitialisation du formulaire
        formulaire.reset();
        formulaire.classList.remove('was-validated');
        compteurMessage.textContent = '0';

        // Défilement doux jusqu'au message de confirmation
        confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus sur le message pour les lecteurs d'écran
        confirmation.focus();
    });
}
