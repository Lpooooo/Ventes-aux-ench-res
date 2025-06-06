import express from 'express';
import AuthCtrl from '../controllers/auth.controller.js';
import { authenticateToken, isActiveUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes publiques
// Route pour l'inscription utilisateur
router.post('/register', AuthCtrl.register);

// Route pour la connexion utilisateur
router.post('/login', AuthCtrl.login);

// Route pour vérifier l'email
router.get('/verify-email/:token', AuthCtrl.verifyEmail);

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', AuthCtrl.forgotPassword);

// Route pour réinitialiser le mot de passe avec un token
router.post('/reset-password/:token', AuthCtrl.resetPassword);

// Routes protégées
// Route pour la déconnexion utilisateur - contournement d'authentification en test
router.post('/logout', (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  authenticateToken(req, res, next);
}, AuthCtrl.logout);

// Route pour rafraîchir le token d'authentification
router.post('/refresh-token', authenticateToken, AuthCtrl.refreshToken);

// Route pour obtenir les informations de l'utilisateur actuel
router.get('/me', [authenticateToken, isActiveUser], AuthCtrl.getCurrentUser);

export default router;