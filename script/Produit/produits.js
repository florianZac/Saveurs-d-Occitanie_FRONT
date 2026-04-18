// =======================================================
// Gestion du cache produits côté front.
// Les produits viennent maintenant de l'API Symfony (GET /api/products).
// Ce module maintient un cache en mémoire pour éviter de recharger
// à chaque navigation vers une page produit.
// =======================================================

import { apiGetProducts, apiGetProduct } from "../api.js";


/**
 * Structure d'un produit :
 *  - id              : identifiant unique (entier)
 *  - nom             : nom commercial
 *  - categorie       : clé technique pour le filtrage
 *  - libelleCategorie: libellé affiché à l'utilisateur
 *  - prix            : prix en euros (décimal)
 *  - image           : URL de l'image produit
 *  - description     : description détaillée
 *  - origine         : région/ville de provenance
 *  - poids           : conditionnement (250g, 75cl, etc.)
 *  - stock           : quantité disponible
 */
export const PRODUITS = [
    {
        id: 1,
        nom: "Huile d'olive AOC de Nyons",
        categorie: "epicerie",
        libelleCategorie: "Épicerie fine",
        prix: 12.50,
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
        description: "Huile d'olive extra-vierge AOC, pressée à froid dans un moulin traditionnel de la Drôme provençale. Parfaite pour assaisonner salades et crudités.",
        origine: "Nyons (Drôme)",
        poids: "500 ml",
        stock: 24
    },
    {
        id: 2,
        nom: "Miel de lavande IGP",
        categorie: "epicerie",
        libelleCategorie: "Épicerie fine",
        prix: 9.00,
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",
        description: "Miel de lavande IGP Provence, récolté par un apiculteur du plateau de Valensole. Texture crémeuse, arômes floraux délicats.",
        origine: "Plateau de Valensole",
        poids: "250 g",
        stock: 40
    },
    {
        id: 3,
        nom: "Roquefort AOP affiné",
        categorie: "fromage",
        libelleCategorie: "Fromages",
        prix: 15.80,
        image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80",
        description: "Roquefort AOP affiné 5 mois dans les caves naturelles du Combalou. Texture crémeuse, saveur corsée.",
        origine: "Roquefort-sur-Soulzon",
        poids: "250 g",
        stock: 15
    },
    {
        id: 4,
        nom: "Tapenade noire artisanale",
        categorie: "epicerie",
        libelleCategorie: "Épicerie fine",
        prix: 6.20,
        image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&q=80",
        description: "Tapenade d'olives noires préparée à la main, aux câpres et anchois. Idéale à l'apéritif sur du pain grillé.",
        origine: "Provence",
        poids: "180 g",
        stock: 32
    },
    {
        id: 5,
        nom: "Cassoulet de Castelnaudary",
        categorie: "epicerie",
        libelleCategorie: "Épicerie fine",
        prix: 18.90,
        image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=80",
        description: "Cassoulet traditionnel aux haricots lingots, confit de canard et saucisse de Toulouse. Recette authentique du Lauragais.",
        origine: "Castelnaudary (Aude)",
        poids: "840 g (2 personnes)",
        stock: 20
    },
    {
        id: 6,
        nom: "Nougat de Montélimar",
        categorie: "confiserie",
        libelleCategorie: "Confiseries",
        prix: 8.50,
        image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&q=80",
        description: "Nougat blanc tendre aux amandes de Provence et miel de lavande. Une gourmandise emblématique du Sud.",
        origine: "Montélimar",
        poids: "200 g",
        stock: 50
    },
    {
        id: 7,
        nom: "Confit de canard du Gers",
        categorie: "epicerie",
        libelleCategorie: "Épicerie fine",
        prix: 22.00,
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80",
        description: "4 cuisses de canard confites dans leur graisse, élevé en plein air dans le Gers. Prêtes à poêler.",
        origine: "Gers",
        poids: "1,2 kg",
        stock: 12
    },
    {
        id: 8,
        nom: "Vin de Cahors AOC",
        categorie: "vin",
        libelleCategorie: "Vins & Spiritueux",
        prix: 14.00,
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
        description: "Vin rouge AOC Cahors 100% Malbec. Robe profonde, tanins soyeux, notes de fruits noirs. Idéal sur un confit.",
        origine: "Cahors (Lot)",
        poids: "75 cl",
        stock: 36
    }
];

// Cache en mémoire vidé quand la page est rechargée complètement
let cacheProduits = null;

/**
 * @description Récupère tous les produits avec cache.
 * Premier appel: fetch API, ensuite ensuite cache mémoire.
 * @returns {Promise<Array>}
 */
export async function getProduits() {
    if (cacheProduits !== null) {
        return cacheProduits;
    }
    cacheProduits = await apiGetProducts();
    return cacheProduits;
}

/**
 * @description Récupère un produit par son ID.
 * Cherche d'abord dans le cache, sinon fait un appel dédié.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getProduitParId(id) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) return null;

    // Si le cache existe, on y cherche
    if (cacheProduits !== null) {
        const trouve = cacheProduits.find(p => p.id === idNum);
        if (trouve) return trouve;
    }

    // Sinon appel dédié utile si on arrive direct sur /produit?id=X
    try {
        return await apiGetProduct(idNum);
    } catch (err) {
        return null;
    }
}

/**
 * @description Invalide le cache utile après une modification admin
 */
export function viderCacheProduits() {
    cacheProduits = null;
}
