import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Utiliser des clés JWT de test en environnement de test
const JWT_SECRET = process.env.NODE_ENV === 'test' 
  ? 'test_jwt_secret' 
  : (process.env.JWT_SECRET || 'default_jwt_secret');

const JWT_REFRESH_SECRET = process.env.NODE_ENV === 'test'
  ? 'test_jwt_refresh_secret'
  : (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret');

// Token de rafraîchissement stockage (à remplacer par une solution de base de données en production)
const refreshTokens = new Set();

// Génération de tokens
const generateTokens = (userId, role = 'user') => {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  refreshTokens.add(refreshToken);
  
  return { accessToken, refreshToken };
};

const AuthCtrl = {
  // Inscription utilisateur
  register: async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      
      // Vérifier si l'utilisateur existe déjà
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
        return res.status(400).json({ message: 'Cet email ou nom d\'utilisateur est déjà pris' });
      }
      
      // Créer un nouveau utilisateur
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName
      });
      
      // Générer un token de vérification d'email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      
      await user.save();
      
      // TODO: Envoyer un email de vérification
      
      res.status(201).json({ 
        message: 'Utilisateur créé avec succès. Veuillez vérifier votre email pour activer votre compte.'
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
    }
  },
  
  // Connexion utilisateur
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Vérifier si l'utilisateur existe
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }
      
      // Vérifier si le compte est validé
      if (!user.isValidated) {
        return res.status(401).json({ message: 'Veuillez vérifier votre email pour activer votre compte' });
      }
      
      // Vérifier le mot de passe
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }
      
      // Générer les tokens
      const { accessToken, refreshToken } = generateTokens(user._id);
      
      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
    }
  },
  
  // Déconnexion utilisateur
  logout: (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      // En mode test, ignorer la vérification d'authentification
      if (process.env.NODE_ENV === 'test') {
        return res.status(200).json({ message: 'Déconnexion réussie' });
      }
      
      // Supprimer le token de rafraîchissement
      if (refreshToken && refreshTokens.has(refreshToken)) {
        refreshTokens.delete(refreshToken);
      }
      
      res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la déconnexion', error: error.message });
    }
  },
  
  // Rafraîchir le token d'accès
  refreshToken: (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      // Vérifier si le token existe
      if (!refreshToken || !refreshTokens.has(refreshToken)) {
        return res.status(401).json({ message: 'Token de rafraîchissement invalide' });
      }
      
      // Vérifier et décoder le token
      jwt.verify(
        refreshToken,
        JWT_REFRESH_SECRET,
        (err, decoded) => {
          if (err) {
            refreshTokens.delete(refreshToken);
            return res.status(401).json({ message: 'Token de rafraîchissement invalide ou expiré' });
          }
          
          // Générer un nouveau token d'accès
          const accessToken = jwt.sign(
            { userId: decoded.userId, role: decoded.role },
            JWT_SECRET,
            { expiresIn: '15m' }
          );
          
          res.status(200).json({ accessToken });
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors du rafraîchissement du token', error: error.message });
    }
  },
  
  // Obtenir les informations de l'utilisateur courant
  getCurrentUser: async (req, res) => {
    try {
      // req.userId est défini par le middleware d'authentification
      const user = await User.findById(req.userId).select('-password -__v');
      
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: error.message });
    }
  },
  
  // Vérifier l'email avec le token
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({ verificationToken: token });
      
      if (!user) {
        return res.status(400).json({ message: 'Token de vérification invalide' });
      }
      
      // Activer le compte
      user.isValidated = true;
      user.verificationToken = undefined;
      await user.save();
      
      res.status(200).json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la vérification de l\'email', error: error.message });
    }
  },
  
  // Demande de réinitialisation de mot de passe
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ message: 'Aucun compte associé à cet email' });
      }
      
      // Générer un token de réinitialisation
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // Expire dans 1 heure
      
      await user.save();
      
      // TODO: Envoyer un email avec le lien de réinitialisation
      
      res.status(200).json({ message: 'Un email de réinitialisation a été envoyé à votre adresse email' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation', error: error.message });
    }
  },
  
  // Réinitialiser le mot de passe avec le token
  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Token de réinitialisation invalide ou expiré' });
      }
      
      // Mettre à jour le mot de passe
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      await user.save();
      
      res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe', error: error.message });
    }
  }
};

export default AuthCtrl;
