import User from '../models/user.model.js';

const UserCtrl = {
  // Récupérer tous les utilisateurs (réservé aux administrateurs)
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().select('-password -__v -resetPasswordToken -resetPasswordExpires -verificationToken');
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
    }
  },

  // Récupérer un utilisateur par son ID
  getUserById: async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId).select('-password -__v -resetPasswordToken -resetPasswordExpires -verificationToken');
      
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: error.message });
    }
  },

  // Mettre à jour un utilisateur
  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Sécurité: empêcher la modification de certains champs sensibles
      delete updateData.password;
      delete updateData.role; // La modification du rôle devrait être une opération distincte
      delete updateData.isValidated;
      delete updateData.verificationToken;
      delete updateData.resetPasswordToken;
      delete updateData.resetPasswordExpires;

      // Mettre à jour la date de mise à jour
      updateData.updatedAt = Date.now();

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -__v -resetPasswordToken -resetPasswordExpires -verificationToken');

      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.status(200).json({ user: updatedUser, message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur', error: error.message });
    }
  },

  // Changer le mot de passe
  changePassword: async (req, res) => {
    try {
      const userId = req.params.id;
      const { currentPassword, newPassword } = req.body;

      // Vérifier que l'utilisateur existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Vérifier que l'ancien mot de passe est correct
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }

      // Mettre à jour le mot de passe
      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors du changement de mot de passe', error: error.message });
    }
  },

  // Changer le rôle d'un utilisateur (réservé aux administrateurs)
  changeUserRole: async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;

      // Vérifier que le rôle est valide
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role, updatedAt: Date.now() },
        { new: true, runValidators: true }
      ).select('-password -__v -resetPasswordToken -resetPasswordExpires -verificationToken');

      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.status(200).json({ user: updatedUser, message: 'Rôle utilisateur modifié avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors du changement de rôle', error: error.message });
    }
  },

  // Activer/désactiver un utilisateur (réservé aux administrateurs)
  toggleUserStatus: async (req, res) => {
    try {
      const userId = req.params.id;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      user.isActive = !user.isActive;
      user.updatedAt = Date.now();
      
      await user.save();

      res.status(200).json({ 
        user: {
          ...user.toObject(),
          password: undefined,
          __v: undefined,
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined,
          verificationToken: undefined
        }, 
        message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès` 
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la modification du statut de l\'utilisateur', error: error.message });
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;

      const deletedUser = await User.findByIdAndDelete(userId);
      
      if (!deletedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: error.message });
    }
  },

  // Rechercher des utilisateurs
  searchUsers: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Paramètre de recherche requis' });
      }

      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      }).select('-password -__v -resetPasswordToken -resetPasswordExpires -verificationToken');

      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la recherche d\'utilisateurs', error: error.message });
    }
  }
};

export default UserCtrl;
