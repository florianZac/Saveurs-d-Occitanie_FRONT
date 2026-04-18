// =======================================================
// Script de la page Modification du mot de passe
// Appelle /api/profile/password
// =======================================================

import { signout, afficherToast } from "../script.js";
import { apiChangePassword } from "../api.js";

/**
 * @description Fonction d'initialisation de la page Modification du mot de passe
 */
export function initEditPasswordPage() {
  // Récupération des éléments du DOM
  const formulaire = document.getElementById('editPasswordForm');
  const ancienMdp  = document.getElementById('ancienMdp');
  const nouveauMdp = document.getElementById('nouveauMdp');
  const confirmMdp = document.getElementById('confirmMdp');
  const alerte     = document.getElementById('alerteEditPwd');
  const btnSubmit  = formulaire ? formulaire.querySelector('button[type="submit"]') : null;

  // Sécurité : on sort si le formulaire n'est pas chargé
  if (!formulaire) return;

  /**
   * @description Affiche une alerte Bootstrap
   * @param {string} message
   * @param {string} type - "success" ou "danger"
   */
  function afficherAlerte(message, type) {
    alerte.className = `alert alert-${type}`;
    alerte.textContent = message;
    alerte.classList.remove('d-none');
  }

  /**
   * @description Vérifie que la nouvelle confirmation correspond au nouveau mot de passe
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
  formulaire.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Vérifications avant envoi
    verifierCorrespondance();
    if (!formulaire.checkValidity()) {
      formulaire.classList.add('was-validated');
      return;
    }

    // Désactivation du bouton 
    if (btnSubmit) {
      btnSubmit.disabled = true;
      var textOriginal = btnSubmit.innerHTML;
      btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Modification...';
    }

    try {
      // Appel API : la vérification de l'ancien mot de passe se fait côté backend
      // (sécurité : on ne fait jamais confiance au client seul)
      await apiChangePassword({
        ancienMdp: ancienMdp.value,
        nouveauMdp: nouveauMdp.value,
      });

      // Succès : affichage + déconnexion automatique
      afficherAlerte(
          'Mot de passe modifié avec succès ! Vous allez être déconnecté pour des raisons de sécurité.',
          'success'
      );
      formulaire.reset();
      formulaire.classList.remove('was-validated');

      // Déconnexion après 2 secondes (bonne pratique : force la reconnexion avec le nouveau mdp)
      setTimeout(() => signout(), 2000);

    } catch (err) {
      afficherAlerte(err.message, 'danger');
      ancienMdp.classList.add('is-invalid');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textOriginal;
      }
    }
  });
}