import express from 'express';
import AuctionCtrl from '../controllers/auction.controller.js';
import { authenticateToken, isAdmin, isActiveUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Middleware pour ajouter le rôle de l'utilisateur à la requête
const addUserRole = async (req, res, next) => {
  if (req.userId) {
    // Le rôle de l'utilisateur est ajouté depuis le middleware authenticate
    req.userRole = req.userRole || 'user'; // Par défaut 'user' si non défini
  }
  next();
};

// Routes publiques
// Récupérer toutes les enchères avec filtres
router.get('/', AuctionCtrl.getAllAuctions);

// Rechercher des enchères
router.get('/search', AuctionCtrl.searchAuctions);

// Routes pour les enchères spécifiques d'un utilisateur
// Obtenir les enchères qu'un utilisateur vend
router.get('/user/selling', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.getUserSellingAuctions);

// Obtenir les enchères sur lesquelles un utilisateur a enchéri
router.get('/user/bidding', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.getUserBiddingAuctions);

// Obtenir les enchères d'un utilisateur spécifique (admin)
router.get('/user/:userId/selling', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.getUserSellingAuctions);

// Obtenir les enchères sur lesquelles un utilisateur spécifique a enchéri (admin)
router.get('/user/:userId/bidding', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.getUserBiddingAuctions);

// Récupérer une enchère par ID (doit être après les routes spécifiques)
router.get('/:id', AuctionCtrl.getAuctionById);

// Routes protégées (nécessitant une authentification)
// Créer une nouvelle enchère
router.post('/', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.createAuction);

// Mettre à jour une enchère
router.put('/:id', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.updateAuction);

// Supprimer une enchère
router.delete('/:id', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.deleteAuction);

// Placer une enchère
router.post('/:id/bid', [authenticateToken, isActiveUser, addUserRole], AuctionCtrl.placeBid);

// Terminer une enchère manuellement (admin)
router.post('/:id/finish', [authenticateToken, isActiveUser, isAdmin, addUserRole], AuctionCtrl.finishAuction);

export default router;
