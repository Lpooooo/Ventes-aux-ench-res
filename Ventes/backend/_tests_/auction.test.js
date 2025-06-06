import request from 'supertest';
import app from '../../App.jsx';
import User from '../models/user.model.js';
import Auction from '../models/auction.model.js';
import { generateTestToken, createTestUser, createTestAdmin, createTestAuction } from '../jest.setup.js';
import mongoose from 'mongoose';

describe('Auction Routes', () => {
  let seller;
  let buyer;
  let admin;
  let sellerToken;
  let buyerToken;
  let adminToken;
  let testAuction;

  // Créer des utilisateurs, des tokens et une enchère pour les tests
  beforeEach(async () => {
    // Créer des utilisateurs
    seller = await createTestUser(User, {
      username: 'seller',
      email: 'seller@example.com'
    });
    
    buyer = await createTestUser(User, {
      username: 'buyer',
      email: 'buyer@example.com'
    });
    
    admin = await createTestAdmin(User);
    
    // Générer des tokens
    sellerToken = generateTestToken(seller._id.toString(), 'user');
    buyerToken = generateTestToken(buyer._id.toString(), 'user');
    adminToken = generateTestToken(admin._id.toString(), 'admin');
    
    // Créer une enchère de test
    testAuction = await createTestAuction(Auction, seller._id);
  });

  // Tests pour récupérer toutes les enchères (route publique)
  describe('GET /api/auctions', () => {
    beforeEach(async () => {
      // Créer plusieurs enchères pour tester la pagination et le filtrage
      await createTestAuction(Auction, seller._id, { 
        title: 'Adobe Photoshop 2023',
        category: 'Logiciel',
        format: 'EXE'
      });
      
      await createTestAuction(Auction, seller._id, { 
        title: 'Ebook sur le développement Node.js',
        category: 'Ebook',
        format: 'PDF'
      });
      
      await createTestAuction(Auction, buyer._id, { 
        title: 'Template WordPress Premium',
        category: 'Template',
        format: 'ZIP'
      });
    });
    
    it('devrait retourner toutes les enchères actives', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .expect(200);
      
      expect(response.body).toHaveProperty('auctions');
      expect(Array.isArray(response.body.auctions)).toBe(true);
      expect(response.body.auctions.length).toBeGreaterThanOrEqual(4); // Au moins 4 enchères
    });
    
    it('devrait filtrer les enchères par catégorie', async () => {
      const response = await request(app)
        .get('/api/auctions?category=Logiciel')
        .expect(200);
      
      expect(response.body).toHaveProperty('auctions');
      expect(Array.isArray(response.body.auctions)).toBe(true);
      expect(response.body.auctions.length).toBeGreaterThanOrEqual(1);
      expect(response.body.auctions[0].category).toBe('Logiciel');
    });
    
    it('devrait paginer les résultats', async () => {
      const response = await request(app)
        .get('/api/auctions?limit=2&page=1')
        .expect(200);
      
      expect(response.body).toHaveProperty('auctions');
      expect(Array.isArray(response.body.auctions)).toBe(true);
      expect(response.body.auctions.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('pages');
    });
  });

  // Tests pour récupérer une enchère par ID (route publique)
  describe('GET /api/auctions/:id', () => {
    it('devrait retourner les détails d\'une enchère spécifique', async () => {
      const response = await request(app)
        .get(`/api/auctions/${testAuction._id}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('auction');
      expect(response.body.auction._id.toString()).toBe(testAuction._id.toString());
      expect(response.body.auction.title).toBe(testAuction.title);
      expect(response.body.auction.seller._id.toString()).toBe(seller._id.toString());
    });
    
    it('devrait retourner une erreur pour un ID d\'enchère invalide', async () => {
      const response = await request(app)
        .get('/api/auctions/invalid-id')
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('invalide');
    });
    
    it('devrait retourner une erreur pour une enchère inexistante', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/auctions/${fakeId}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('non trouvée');
    });
  });

  // Tests pour créer une nouvelle enchère
  describe('POST /api/auctions', () => {
    it('devrait permettre à un utilisateur authentifié de créer une enchère', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const auctionData = {
        title: 'Nouveau Produit Digital',
        description: 'Description du nouveau produit digital',
        startingPrice: 100,
        category: 'Logiciel',
        format: 'ZIP',
        licenseType: 'Usage unique',
        deliveryMethod: 'Téléchargement',
        fileSize: 50,
        endDate: tomorrow.toISOString()
      };
      
      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(auctionData)
        .expect(201);
      
      expect(response.body).toHaveProperty('auction');
      expect(response.body.auction.title).toBe(auctionData.title);
      expect(response.body.auction.description).toBe(auctionData.description);
      expect(response.body.auction.startingPrice).toBe(auctionData.startingPrice);
      expect(response.body.auction.format).toBe(auctionData.format);
      expect(response.body.auction.licenseType).toBe(auctionData.licenseType);
      expect(response.body.auction.seller.toString()).toBe(seller._id.toString());
    });
    
    it('devrait refuser la création d\'une enchère sans authentification', async () => {
      const auctionData = {
        title: 'Produit Digital Non Autorisé',
        description: 'Description',
        startingPrice: 100,
        category: 'Logiciel',
        format: 'EXE',
        licenseType: 'Usage unique',
        deliveryMethod: 'Téléchargement',
        endDate: new Date().toISOString()
      };
      
      const response = await request(app)
        .post('/api/auctions')
        .send(auctionData)
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token manquant');
    });
    
    it('devrait refuser la création d\'une enchère avec une date de fin déjà passée', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const auctionData = {
        title: 'Produit Digital Date Passée',
        description: 'Description',
        startingPrice: 100,
        category: 'Logiciel',
        format: 'ZIP',
        licenseType: 'Usage unique',
        deliveryMethod: 'Téléchargement',
        fileSize: 25,
        endDate: yesterday.toISOString()
      };
      
      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(auctionData)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('date de fin');
    });
  });

  // Tests pour placer une enchère
  describe('POST /api/auctions/:id/bid', () => {
    it('devrait permettre à un utilisateur de placer une enchère', async () => {
      const bidData = {
        amount: testAuction.currentPrice + 10
      };
      
      const response = await request(app)
        .post(`/api/auctions/${testAuction._id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(bidData)
        .expect(200);
      
      expect(response.body).toHaveProperty('auction');
      expect(response.body.auction.currentPrice).toBe(bidData.amount);
      expect(response.body.auction.bids.length).toBe(1);
      expect(response.body.auction.bids[0].userId._id.toString()).toBe(buyer._id.toString());
      expect(response.body.auction.bids[0].amount).toBe(bidData.amount);
    });
    
    it('devrait refuser une enchère inférieure au prix actuel', async () => {
      const bidData = {
        amount: testAuction.currentPrice - 10
      };
      
      const response = await request(app)
        .post(`/api/auctions/${testAuction._id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(bidData)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('supérieure au prix actuel');
    });
    
    it('devrait empêcher le vendeur d\'enchérir sur sa propre enchère', async () => {
      const bidData = {
        amount: testAuction.currentPrice + 10
      };
      
      const response = await request(app)
        .post(`/api/auctions/${testAuction._id}/bid`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bidData)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('vendeur ne peut pas enchérir');
    });
  });

  // Tests pour mettre à jour une enchère
  describe('PUT /api/auctions/:id', () => {
    it('devrait permettre au vendeur de mettre à jour son enchère', async () => {
      const updateData = {
        title: 'Titre Mis à Jour',
        description: 'Description mise à jour'
      };
      
      const response = await request(app)
        .put(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('auction');
      expect(response.body.auction.title).toBe(updateData.title);
      expect(response.body.auction.description).toBe(updateData.description);
    });
    
    it('devrait permettre à un admin de mettre à jour n\'importe quelle enchère', async () => {
      const updateData = {
        title: 'Titre Mis à Jour par Admin',
        description: 'Description mise à jour par admin'
      };
      
      const response = await request(app)
        .put(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('auction');
      expect(response.body.auction.title).toBe(updateData.title);
      expect(response.body.auction.description).toBe(updateData.description);
    });
    
    it('devrait refuser la mise à jour par un utilisateur non autorisé', async () => {
      const updateData = {
        title: 'Tentative Non Autorisée',
        description: 'Cette mise à jour ne devrait pas fonctionner'
      };
      
      const response = await request(app)
        .put(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(updateData)
        .expect(403);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Accès non autorisé');
    });
    
    it('devrait refuser la mise à jour après qu\'une enchère a été placée', async () => {
      // Placer d'abord une enchère
      await request(app)
        .post(`/api/auctions/${testAuction._id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ amount: testAuction.currentPrice + 10 });
      
      const updateData = {
        title: 'Tentative Après Enchère',
        description: 'Cette mise à jour ne devrait pas fonctionner'
      };
      
      const response = await request(app)
        .put(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('déjà reçu des offres');
    });
  });

  // Tests pour supprimer une enchère
  describe('DELETE /api/auctions/:id', () => {
    it('devrait permettre au vendeur de supprimer son enchère sans offres', async () => {
      const response = await request(app)
        .delete(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('supprimée avec succès');
      
      // Vérifier que l'enchère a été marquée comme supprimée
      const deletedAuction = await Auction.findById(testAuction._id);
      expect(deletedAuction.isDeleted).toBe(true);
      expect(deletedAuction.status).toBe('Annulée');
    });
    
    it('devrait permettre à un admin de supprimer n\'importe quelle enchère', async () => {
      const response = await request(app)
        .delete(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('supprimée avec succès');
    });
    
    it('devrait refuser la suppression par un utilisateur non autorisé', async () => {
      const response = await request(app)
        .delete(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Accès non autorisé');
    });
    
    it('devrait refuser la suppression après qu\'une enchère a été placée (non-admin)', async () => {
      // Placer d'abord une enchère
      await request(app)
        .post(`/api/auctions/${testAuction._id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ amount: testAuction.currentPrice + 10 });
      
      const response = await request(app)
        .delete(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('déjà reçu des offres');
    });
    
    it('devrait permettre à un admin de supprimer une enchère avec des offres', async () => {
      // Placer d'abord une enchère
      await request(app)
        .post(`/api/auctions/${testAuction._id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ amount: testAuction.currentPrice + 10 });
      
      const response = await request(app)
        .delete(`/api/auctions/${testAuction._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('supprimée avec succès');
    });
  });

  // Tests pour terminer une enchère manuellement (admin uniquement)
  describe('POST /api/auctions/:id/finish', () => {
    it('devrait permettre à un admin de terminer une enchère', async () => {
      // Placer d'abord une enchère pour avoir un gagnant
      await request(app)
        .post(`/api/auctions/${testAuction._id}/bid`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ amount: testAuction.currentPrice + 10 });
      
      const response = await request(app)
        .post(`/api/auctions/${testAuction._id}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('auction');
      expect(response.body.auction.status).toBe('Terminée');
      expect(response.body.auction.winner._id.toString()).toBe(buyer._id.toString());
    });
    
    it('devrait refuser la terminaison d\'une enchère par un non-admin', async () => {
      const response = await request(app)
        .post(`/api/auctions/${testAuction._id}/finish`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Droits administrateur');
    });
  });

  // Tests pour les fonctionnalités de recherche
  describe('GET /api/auctions/search', () => {
    beforeEach(async () => {
      // Créer des enchères avec des termes de recherche spécifiques
      await createTestAuction(Auction, seller._id, { 
        title: 'Adobe Illustrator 2023',
        description: 'Logiciel de création graphique vectorielle',
        category: 'Logiciel',
        format: 'EXE'
      });
      
      await createTestAuction(Auction, seller._id, { 
        title: 'Tutoriel Adobe Photoshop',
        description: 'Formation complète en édition d\'images',
        category: 'Formation',
        format: 'MP4'
      });
    });
    
    it('devrait rechercher des enchères par mot-clé', async () => {
      const response = await request(app)
        .get('/api/auctions/search?query=adobe')
        .expect(200);
      
      expect(response.body).toHaveProperty('auctions');
      expect(Array.isArray(response.body.auctions)).toBe(true);
      expect(response.body.auctions.length).toBeGreaterThanOrEqual(1);
      expect(response.body.auctions[0].title.toLowerCase()).toContain('adobe');
    });
    
    it('devrait filtrer les résultats de recherche par catégorie', async () => {
      // Créer des enchères avec la catégorie Logiciel pour garantir des résultats
      await createTestAuction(Auction, seller._id, { 
        title: 'Adobe Premiere Pro',
        description: 'Logiciel de montage vidéo',
        category: 'Logiciel',
        format: 'EXE'
      });
      
      const response = await request(app)
        .get('/api/auctions/search?query=adobe&category=Logiciel')
        .expect(200);
      
      expect(response.body).toHaveProperty('auctions');
      expect(Array.isArray(response.body.auctions)).toBe(true);
      expect(response.body.auctions.length).toBeGreaterThanOrEqual(1);
      expect(response.body.auctions.every(a => a.category === 'Logiciel')).toBe(true);
    });
  });
}); 