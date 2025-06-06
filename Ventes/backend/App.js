import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import auctionRoutes from './routes/auction.route.js';

// Middleware
import { authenticateToken } from './middlewares/auth.middleware.js';

// Configuration
dotenv.config();

// Initialisation de l'application Express
const app = express();

// Configuration du parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Logger pour les requêtes entrantes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Capturer la réponse pour logger le statut
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`${new Date().toISOString()} - Réponse: ${res.statusCode} pour ${req.method} ${req.url}`);
    originalSend.call(this, body);
  };
  
  next();
});

// Configuration CORS
const corsOptions = {
  origin: '*', // Autoriser toutes les origines
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// En-têtes personnalisés
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// Route de base pour vérifier si l'API fonctionne
app.get('/api', (req, res) => {
  res.json({ message: 'API Fil Rouge - Bienvenue!' });
});

// Route de test pour CORS sans authentification
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test de CORS réussi!', 
    info: 'Cette route ne nécessite pas d\'authentification',
    headers: req.headers
  });
});

// Configuration des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auctions', auctionRoutes);

// Route JWT pour vérifier l'authentification
app.get('/api/jwtid', authenticateToken, (req, res) => {
  res.status(200).json({ userId: req.userId });
});

// Gestion des routes inexistantes
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

export default app; 