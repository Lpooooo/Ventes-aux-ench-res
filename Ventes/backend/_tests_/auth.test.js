import request from 'supertest';
import app from '../../App.jsx';
import User from '../models/user.model.js';

describe('Auth Routes', () => {
  // Test de la route d'inscription
  describe('POST /api/auth/register', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const userData = {
        username: 'nouveauuser',
        email: 'nouveau@example.com',
        password: 'password123',
        firstName: 'Nouveau',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('créé avec succès');

      // Vérifier que l'utilisateur existe dans la base de données
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.username).toBe(userData.username);
    });

    it('devrait rejeter l\'inscription avec un email déjà utilisé', async () => {
      // Créer d'abord un utilisateur
      const userData = {
        username: 'existant',
        email: 'existant@example.com',
        password: 'password123',
        firstName: 'Existant',
        lastName: 'User'
      };

      await User.create(userData);

      // Essayer de créer un autre utilisateur avec le même email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'autre',
          email: 'existant@example.com',
          password: 'password123',
          firstName: 'Autre',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('déjà pris');
    });
  });

  // Test de la route de connexion
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Créer un utilisateur validé pour les tests
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        isValidated: true
      });
      await user.save();
    });

    it('devrait connecter un utilisateur existant avec succès', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('devrait rejeter la connexion avec des identifiants incorrects', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'mauvais_mot_de_passe'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('incorrect');
    });

    it('devrait rejeter la connexion pour un utilisateur non validé', async () => {
      // Créer un utilisateur non validé
      const user = new User({
        username: 'nonvalide',
        email: 'nonvalide@example.com',
        password: 'password123',
        firstName: 'Non',
        lastName: 'Validé',
        isValidated: false
      });
      await user.save();

      const loginData = {
        email: 'nonvalide@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('vérifier votre email');
    });
  });

  // Test de la route de déconnexion
  describe('POST /api/auth/logout', () => {
    it('devrait déconnecter un utilisateur avec succès', async () => {
      // Simuler une déconnexion avec un refreshToken
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'token-factice' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Déconnexion réussie');
    });
  });

  // Test de la route de vérification d'email (simulé)
  describe('GET /api/auth/verify-email/:token', () => {
    it('devrait retourner une erreur pour un token invalide', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email/token-invalide')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token de vérification invalide');
    });

    it('devrait valider un compte avec un token valide', async () => {
      // Créer un utilisateur avec un token de vérification
      const verificationToken = 'token-valide-12345';
      const user = new User({
        username: 'avectoken',
        email: 'avectoken@example.com',
        password: 'password123',
        firstName: 'Avec',
        lastName: 'Token',
        isValidated: false,
        verificationToken
      });
      await user.save();

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('vérifié avec succès');

      // Vérifier que l'utilisateur est maintenant validé
      const updatedUser = await User.findOne({ email: 'avectoken@example.com' });
      expect(updatedUser.isValidated).toBe(true);
      expect(updatedUser.verificationToken).toBeUndefined();
    });
  });
}); 