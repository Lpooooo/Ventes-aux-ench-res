import Auction from '../models/auction.model.js';
import mongoose from 'mongoose';

const AuctionCtrl = {
  // Récupérer toutes les enchères actives
  getAllAuctions: async (req, res) => {
    try {
      const { category, status, sort, limit = 10, page = 1 } = req.query;
      
      // Construire le filtre de base (uniquement les enchères non supprimées)
      const filter = { isDeleted: false };
      
      // Filtrer par catégorie si spécifié
      if (category) {
        filter.category = category;
      }
      
      // Filtrer par statut si spécifié
      if (status) {
        filter.status = status;
      }
      
      // Compter les documents pour la pagination
      const totalDocs = await Auction.countDocuments(filter);
      
      // Options de tri
      let sortOption = {};
      if (sort === 'recent') {
        sortOption = { createdAt: -1 };
      } else if (sort === 'price-asc') {
        sortOption = { currentPrice: 1 };
      } else if (sort === 'price-desc') {
        sortOption = { currentPrice: -1 };
      } else if (sort === 'ending-soon') {
        sortOption = { endDate: 1 };
      } else {
        // Par défaut, trier par date de création (plus récent d'abord)
        sortOption = { createdAt: -1 };
      }
      
      // Calculer le nombre de documents à sauter pour la pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Récupérer les enchères avec pagination
      const auctions = await Auction.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('seller', 'username firstName lastName')
        .populate('bids.userId', 'username firstName lastName');
      
      res.status(200).json({
        auctions,
        pagination: {
          total: totalDocs,
          page: parseInt(page),
          pages: Math.ceil(totalDocs / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des enchères', error: error.message });
    }
  },
  
  // Récupérer une enchère par son ID
  getAuctionById: async (req, res) => {
    try {
      const auctionId = req.params.id;
      
      // Vérifier que l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(auctionId)) {
        return res.status(400).json({ message: 'ID d\'enchère invalide' });
      }
      
      const auction = await Auction.findById(auctionId)
        .populate('seller', 'username firstName lastName email')
        .populate('winner', 'username firstName lastName')
        .populate('bids.userId', 'username firstName lastName');
      
      if (!auction || auction.isDeleted) {
        return res.status(404).json({ message: 'Enchère non trouvée' });
      }
      
      res.status(200).json({ auction });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'enchère', error: error.message });
    }
  },
  
  // Créer une nouvelle enchère
  createAuction: async (req, res) => {
    try {
      const { 
        title, 
        description, 
        startingPrice, 
        category, 
        format, 
        licenseType, 
        deliveryMethod, 
        fileSize,
        imageUrl, 
        endDate 
      } = req.body;
      
      // Vérifier que la date de fin est dans le futur
      const endDateObj = new Date(endDate);
      if (endDateObj <= new Date()) {
        return res.status(400).json({ message: 'La date de fin doit être dans le futur' });
      }
      
      // Créer une nouvelle enchère
      const newAuction = new Auction({
        title,
        description,
        startingPrice,
        currentPrice: startingPrice,
        category,
        format,
        licenseType,
        deliveryMethod,
        fileSize: fileSize || 0,
        imageUrl,
        seller: req.userId, // L'ID du vendeur est l'utilisateur connecté
        startDate: new Date(),
        endDate: endDateObj,
        status: 'En cours'
      });
      
      await newAuction.save();
      
      res.status(201).json({ 
        auction: newAuction, 
        message: 'Enchère créée avec succès' 
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la création de l\'enchère', error: error.message });
    }
  },
  
  // Mettre à jour une enchère
  updateAuction: async (req, res) => {
    try {
      const auctionId = req.params.id;
      const { 
        title, 
        description, 
        category, 
        format, 
        licenseType, 
        deliveryMethod, 
        fileSize, 
        imageUrl, 
        endDate 
      } = req.body;
      
      // Vérifier que l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(auctionId)) {
        return res.status(400).json({ message: 'ID d\'enchère invalide' });
      }
      
      // Récupérer l'enchère
      const auction = await Auction.findById(auctionId);
      
      if (!auction || auction.isDeleted) {
        return res.status(404).json({ message: 'Enchère non trouvée' });
      }
      
      // Vérifier que l'utilisateur est le vendeur
      if (auction.seller.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé. Vous n\'êtes pas le vendeur de cette enchère.' });
      }
      
      // Vérifier que l'enchère n'a pas encore reçu d'enchères
      if (auction.bids.length > 0) {
        return res.status(400).json({ message: 'Impossible de modifier une enchère qui a déjà reçu des offres' });
      }
      
      // Vérifier que l'enchère est toujours en cours
      if (auction.status !== 'En cours') {
        return res.status(400).json({ message: 'Impossible de modifier une enchère terminée ou annulée' });
      }
      
      // Mettre à jour les champs
      if (title) auction.title = title;
      if (description) auction.description = description;
      if (category) auction.category = category;
      if (format) auction.format = format;
      if (licenseType) auction.licenseType = licenseType;
      if (deliveryMethod) auction.deliveryMethod = deliveryMethod;
      if (fileSize !== undefined) auction.fileSize = fileSize;
      if (imageUrl) auction.imageUrl = imageUrl;
      
      // Si la date de fin est spécifiée et est dans le futur
      if (endDate) {
        const endDateObj = new Date(endDate);
        if (endDateObj <= new Date()) {
          return res.status(400).json({ message: 'La date de fin doit être dans le futur' });
        }
        auction.endDate = endDateObj;
      }
      
      await auction.save();
      
      res.status(200).json({ 
        auction, 
        message: 'Enchère mise à jour avec succès' 
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'enchère', error: error.message });
    }
  },
  
  // Supprimer une enchère (suppression logique)
  deleteAuction: async (req, res) => {
    try {
      const auctionId = req.params.id;
      
      // Vérifier que l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(auctionId)) {
        return res.status(400).json({ message: 'ID d\'enchère invalide' });
      }
      
      // Récupérer l'enchère
      const auction = await Auction.findById(auctionId);
      
      if (!auction || auction.isDeleted) {
        return res.status(404).json({ message: 'Enchère non trouvée' });
      }
      
      // Vérifier que l'utilisateur est le vendeur ou un administrateur
      if (auction.seller.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé. Vous n\'êtes pas le vendeur de cette enchère.' });
      }
      
      // Vérifier si des enchères ont été placées
      if (auction.bids.length > 0 && req.userRole !== 'admin') {
        return res.status(400).json({ message: 'Impossible de supprimer une enchère qui a déjà reçu des offres. Contactez un administrateur.' });
      }
      
      // Suppression logique
      auction.isDeleted = true;
      auction.isActive = false;
      
      // Si enchère en cours, la mettre en "Annulée"
      if (auction.status === 'En cours') {
        auction.status = 'Annulée';
      }
      
      await auction.save();
      
      res.status(200).json({ message: 'Enchère supprimée avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression de l\'enchère', error: error.message });
    }
  },
  
  // Placer une enchère
  placeBid: async (req, res) => {
    try {
      const auctionId = req.params.id;
      const { amount } = req.body;
      
      // Vérifier que l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(auctionId)) {
        return res.status(400).json({ message: 'ID d\'enchère invalide' });
      }
      
      // Vérifier que le montant est valide
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Montant d\'enchère invalide' });
      }
      
      // Récupérer l'enchère
      const auction = await Auction.findById(auctionId);
      
      if (!auction || auction.isDeleted || !auction.isActive) {
        return res.status(404).json({ message: 'Enchère non trouvée ou inactive' });
      }
      
      try {
        // Utiliser la méthode placeBid du modèle pour placer l'enchère
        const updatedAuction = await auction.placeBid(req.userId, parseFloat(amount));
        
        // Populate pour les détails de l'utilisateur
        await updatedAuction.populate('bids.userId', 'username firstName lastName');
        
        res.status(200).json({ 
          auction: updatedAuction, 
          message: 'Enchère placée avec succès' 
        });
      } catch (bidError) {
        return res.status(400).json({ message: bidError.message });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors du placement de l\'enchère', error: error.message });
    }
  },
  
  // Terminer une enchère manuellement (admin seulement)
  finishAuction: async (req, res) => {
    try {
      const auctionId = req.params.id;
      
      // Vérifier que l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(auctionId)) {
        return res.status(400).json({ message: 'ID d\'enchère invalide' });
      }
      
      // Récupérer l'enchère
      const auction = await Auction.findById(auctionId);
      
      if (!auction || auction.isDeleted) {
        return res.status(404).json({ message: 'Enchère non trouvée' });
      }
      
      // Vérifier que l'utilisateur est un administrateur
      if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Action non autorisée. Seuls les administrateurs peuvent terminer une enchère manuellement.' });
      }
      
      try {
        // Utiliser la méthode finishAuction du modèle pour terminer l'enchère
        const finishedAuction = await auction.finishAuction();
        
        // Populate pour les détails de l'utilisateur
        await finishedAuction.populate('winner', 'username firstName lastName email');
        
        res.status(200).json({ 
          auction: finishedAuction, 
          message: 'Enchère terminée avec succès' 
        });
      } catch (finishError) {
        return res.status(400).json({ message: finishError.message });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la finalisation de l\'enchère', error: error.message });
    }
  },
  
  // Obtenir les enchères d'un utilisateur (vendeur)
  getUserSellingAuctions: async (req, res) => {
    try {
      const userId = req.params.userId || req.userId;
      
      // Si l'utilisateur demande les enchères d'un autre utilisateur et n'est pas admin
      if (userId !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
      
      const auctions = await Auction.find({ 
        seller: userId,
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .populate('bids.userId', 'username firstName lastName');
      
      res.status(200).json({ auctions });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des enchères de l\'utilisateur', error: error.message });
    }
  },
  
  // Obtenir les enchères sur lesquelles un utilisateur a enchéri
  getUserBiddingAuctions: async (req, res) => {
    try {
      const userId = req.params.userId || req.userId;
      
      // Si l'utilisateur demande les enchères d'un autre utilisateur et n'est pas admin
      if (userId !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
      
      // Trouver toutes les enchères où l'utilisateur a placé au moins une enchère
      const auctions = await Auction.find({ 
        'bids.userId': userId,
        isDeleted: false
      })
      .sort({ endDate: 1 })
      .populate('seller', 'username firstName lastName')
      .populate('bids.userId', 'username firstName lastName');
      
      res.status(200).json({ auctions });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des enchères de l\'utilisateur', error: error.message });
    }
  },
  
  // Rechercher des enchères
  searchAuctions: async (req, res) => {
    try {
      const { query, category, status } = req.query;
      
      // Construire le filtre de base (uniquement les enchères non supprimées)
      const filter = { isDeleted: false };
      
      // Ajouter la recherche textuelle si un terme de recherche est fourni
      if (query) {
        filter.$text = { $search: query };
      }
      
      // Filtrer par catégorie si spécifié
      if (category) {
        filter.category = category;
      }
      
      // Filtrer par statut si spécifié
      if (status) {
        filter.status = status;
      }
      
      const auctions = await Auction.find(filter)
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .limit(20)
        .populate('seller', 'username firstName lastName');
      
      res.status(200).json({ auctions });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la recherche d\'enchères', error: error.message });
    }
  }
};

export default AuctionCtrl;
