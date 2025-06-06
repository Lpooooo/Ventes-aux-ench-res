import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    minlength: 3
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  startingPrice: {
    type: Number,
    required: [true, 'Le prix de départ est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  currentPrice: {
    type: Number,
    default: function() {
      return this.startingPrice;
    }
  },
  imageUrl: {
    type: String
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['Logiciel', 'Jeu Vidéo', 'Ebook', 'Musique', 'Film', 'Formation', 'Art Digital', 'Template', 'Plugin', 'NFT', 'Autre']
  },
  format: {
    type: String,
    required: [true, 'Le format est requis'],
    enum: ['PDF', 'EPUB', 'MP3', 'MP4', 'EXE', 'ZIP', 'APK', 'ISO', 'JPG/PNG', 'Lien Web', 'Autre']
  },
  licenseType: {
    type: String,
    enum: ['Usage unique', 'Usage multiple', 'Abonnement', 'Perpétuelle', 'Open-source', 'Commerciale', 'Non-commerciale', 'Revente autorisée'],
    default: 'Usage unique'
  },
  deliveryMethod: {
    type: String,
    enum: ['Téléchargement', 'Lien web', 'Clé d\'activation', 'Email', 'Transfert direct'],
    default: 'Téléchargement'
  },
  fileSize: {
    type: Number,
    min: 0,
    default: 0 // Taille en Mo
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bids: [bidSchema],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est requise']
  },
  status: {
    type: String,
    enum: ['En cours', 'Terminée', 'Annulée'],
    default: 'En cours'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Méthode pour placer une enchère
auctionSchema.methods.placeBid = async function(userId, amount) {
  // Vérifier que l'enchère est en cours
  if (this.status !== 'En cours') {
    throw new Error('L\'enchère n\'est plus disponible');
  }
  
  // Vérifier que l'enchère n'est pas expirée
  if (new Date() > this.endDate) {
    throw new Error('Cette enchère est terminée');
  }
  
  // Vérifier que le montant de l'enchère est supérieur au prix actuel
  if (amount <= this.currentPrice) {
    throw new Error('L\'enchère doit être supérieure au prix actuel');
  }
  
  // Vérifier que l'utilisateur n'est pas le vendeur
  if (userId.toString() === this.seller.toString()) {
    throw new Error('Le vendeur ne peut pas enchérir sur son propre produit digital');
  }
  
  // Ajouter l'enchère
  this.bids.push({
    userId,
    amount
  });
  
  // Mettre à jour le prix actuel
  this.currentPrice = amount;
  
  // Sauvegarder les changements
  await this.save();
  
  return this;
};

// Méthode pour terminer une enchère
auctionSchema.methods.finishAuction = async function() {
  // Vérifier que l'enchère est toujours en cours
  if (this.status !== 'En cours') {
    throw new Error('L\'enchère est déjà terminée ou annulée');
  }
  
  // Définir le statut comme terminé
  this.status = 'Terminée';
  
  // Déterminer le gagnant (le dernier enchérisseur)
  if (this.bids.length > 0) {
    const highestBid = this.bids.sort((a, b) => b.amount - a.amount)[0];
    this.winner = highestBid.userId;
  }
  
  // Sauvegarder les changements
  await this.save();
  
  return this;
};

// Middleware pré-sauvegarde pour mettre à jour la date de mise à jour
auctionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour la recherche
auctionSchema.index({ title: 'text', description: 'text' });

const Auction = mongoose.model('Auction', auctionSchema);

export default Auction; 