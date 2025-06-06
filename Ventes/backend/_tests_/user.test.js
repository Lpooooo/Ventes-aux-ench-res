import request from 'supertest';
import app from '../../App.jsx';
import User from '../models/user.model.js';
import { generateTestToken, createTestUser, createTestAdmin } from '../jest.setup.js';
import mongoose from 'mongoose';

describe('User Routes', () => {
  let testUser;
  let testAdmin;
  let userToken;
  let adminToken;

  // Créer des utilisateurs et des tokens pour les tests
  beforeEach(async () => {
    testUser = await createTestUser(User);
    testAdmin = await createTestAdmin(User);
    userToken = generateTestToken(testUser._id.toString(), 'user');
    adminToken = generateTestToken(testAdmin._id.toString(), 'admin');
  });

  // Tests pour obtenir tous les utilisateurs (admin uniquement)
  describe('GET /api/users', () => {
    it('devrait retourner tous les utilisateurs pour un admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(2); // Au moins testUser et testAdmin
    });

    it('devrait refuser l\'accès à un utilisateur non-admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Droits administrateur');
    });

    it('devrait refuser l\'accès sans token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token manquant');
    });
  });

  // Tests pour obtenir un utilisateur par ID
  describe('GET /api/users/:id', () => {
    it('devrait retourner les informations de l\'utilisateur pour l\'utilisateur lui-même', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user._id.toString()).toBe(testUser._id.toString());
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('devrait retourner les informations de l\'utilisateur pour un admin', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user._id.toString()).toBe(testUser._id.toString());
    });

    it('devrait refuser l\'accès à un autre utilisateur non-admin', async () => {
      const otherUser = await createTestUser(User, {
        username: 'otheruser',
        email: 'other@example.com'
      });

      const response = await request(app)
        .get(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('pas les droits nécessaires');
    });

    it('devrait retourner une erreur pour un ID utilisateur invalide', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });

    it('devrait retourner une erreur pour un utilisateur inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('non trouvé');
    });
  });

  // Tests pour mettre à jour un utilisateur
  describe('PUT /api/users/:id', () => {
    it('devrait mettre à jour l\'utilisateur lui-même', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);

      // Vérifier que les données ont été mises à jour dans la BDD
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
    });

    it('devrait rejeter les champs sensibles lors de la mise à jour', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'admin', // Champ sensible qui ne devrait pas être modifié
        password: 'newpassword' // Champ sensible qui ne devrait pas être modifié
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      // Vérifier que l'utilisateur a été mis à jour
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      
      // Vérifier que les champs sensibles n'ont pas été modifiés
      expect(updatedUser.role).toBe('user');
      expect(updatedUser.password).not.toBe('newpassword');
    });

    it('devrait permettre à un admin de mettre à jour n\'importe quel utilisateur', async () => {
      const updateData = {
        firstName: 'Admin',
        lastName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(updateData.lastName);
    });

    it('devrait refuser la mise à jour pour un autre utilisateur non-admin', async () => {
      const otherUser = await createTestUser(User, {
        username: 'otheruser',
        email: 'other@example.com'
      });

      const updateData = {
        firstName: 'Should',
        lastName: 'NotUpdate'
      };

      const response = await request(app)
        .put(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('pas les droits nécessaires');
    });
  });

  // Tests pour changer le rôle d'un utilisateur (admin uniquement)
  describe('PUT /api/users/:id/role', () => {
    it('devrait permettre à un admin de changer le rôle d\'un utilisateur', async () => {
      const response = await request(app)
        .put(`/api/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('admin');

      // Vérifier que le rôle a été changé dans la BDD
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe('admin');
    });

    it('devrait refuser le changement de rôle pour un utilisateur non-admin', async () => {
      const response = await request(app)
        .put(`/api/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Droits administrateur');
    });

    it('devrait rejeter un rôle invalide', async () => {
      const response = await request(app)
        .put(`/api/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Rôle invalide');
    });
  });

  // Tests pour supprimer un utilisateur
  describe('DELETE /api/users/:id', () => {
    it('devrait permettre à un utilisateur de supprimer son propre compte', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('supprimé avec succès');

      // Vérifier que l'utilisateur a été supprimé
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it('devrait permettre à un admin de supprimer n\'importe quel utilisateur', async () => {
      const otherUser = await createTestUser(User, {
        username: 'otheruser',
        email: 'other@example.com'
      });

      const response = await request(app)
        .delete(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('supprimé avec succès');

      // Vérifier que l'utilisateur a été supprimé
      const deletedUser = await User.findById(otherUser._id);
      expect(deletedUser).toBeNull();
    });

    it('devrait refuser la suppression pour un autre utilisateur non-admin', async () => {
      const otherUser = await createTestUser(User, {
        username: 'otheruser',
        email: 'other@example.com'
      });

      const response = await request(app)
        .delete(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('pas les droits nécessaires');
    });
  });

  // Tests pour la recherche d'utilisateurs
  describe('GET /api/users/search', () => {
    beforeEach(async () => {
      // Créer plusieurs utilisateurs pour tester la recherche
      await createTestUser(User, {
        username: 'searchuser1',
        email: 'search1@example.com',
        firstName: 'Search',
        lastName: 'User1'
      });
      await createTestUser(User, {
        username: 'searchuser2',
        email: 'search2@example.com',
        firstName: 'Search',
        lastName: 'User2'
      });
    });

    it('devrait permettre à un admin de rechercher des utilisateurs', async () => {
      const response = await request(app)
        .get('/api/users/search?query=search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(2);
      expect(response.body.users.some(u => u.username === 'searchuser1')).toBe(true);
      expect(response.body.users.some(u => u.username === 'searchuser2')).toBe(true);
    });

    it('devrait refuser la recherche pour un utilisateur non-admin', async () => {
      const response = await request(app)
        .get('/api/users/search?query=search')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Droits administrateur');
    });

    it('devrait exiger un paramètre de recherche', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Paramètre de recherche requis');
    });
  });
}); 