import express from 'express';
import UserCtrl from '../controllers/user.controller.js';
import { authenticateToken, isAdmin, isActiveUser, isOwnerOrAdmin } from '../middlewares/auth.middleware.js';
// TODO: Importer middleware d'authentification pour protéger les routes

const router = express.Router();

// Route pour récupérer tous les utilisateurs (admin uniquement)
router.get('/', [authenticateToken, isActiveUser, isAdmin], UserCtrl.getAllUsers);

// Route pour rechercher des utilisateurs (admin uniquement)
router.get('/search', [authenticateToken, isActiveUser, isAdmin], UserCtrl.searchUsers);

// Route pour récupérer un utilisateur par ID (propriétaire ou admin)
router.get('/:id', [authenticateToken, isActiveUser, isOwnerOrAdmin], UserCtrl.getUserById);

// Route pour mettre à jour un utilisateur (propriétaire ou admin)
router.put('/:id', [authenticateToken, isActiveUser, isOwnerOrAdmin], UserCtrl.updateUser);

// Route pour changer le mot de passe d'un utilisateur (propriétaire ou admin)
router.put('/:id/password', [authenticateToken, isActiveUser, isOwnerOrAdmin], UserCtrl.changePassword);

// Route pour changer le rôle d'un utilisateur (admin uniquement)
router.put('/:id/role', [authenticateToken, isActiveUser, isAdmin], UserCtrl.changeUserRole);

// Route pour activer/désactiver un utilisateur (admin uniquement)
router.put('/:id/status', [authenticateToken, isActiveUser, isAdmin], UserCtrl.toggleUserStatus);

// Route pour supprimer un utilisateur (propriétaire ou admin)
router.delete('/:id', [authenticateToken, isActiveUser, isOwnerOrAdmin], UserCtrl.deleteUser);

export default router; 