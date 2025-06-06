import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './App.js';

// Configuration
dotenv.config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ynovAdmin:snakerpgm77258@sportshop-dev.0jjg2dv.mongodb.net/?retryWrites=true&w=majority&appName=sportshop-dev');
    console.log('MongoDB connecté avec succès');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 3443;

// Démarrage du serveur
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
};

startServer().catch(err => console.error('Erreur au démarrage du serveur:', err));

