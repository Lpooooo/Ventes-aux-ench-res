import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ImageBackground } from 'react-native';

const AuthScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Simulez une authentification réussie
    if (username === 'admin' && password === 'password') {
      navigation.replace('Products'); // Redirige vers la liste des produits après authentification
    } else {
      alert('Nom d’utilisateur ou mot de passe incorrect');
    }
  };

    return (
        <ImageBackground
      source={require('../assets/Web-Application-Components-Models.png')} // Remplacez par le chemin de votre image
      style={styles.background}
    >
    <View style={styles.container}>
      <Text style={styles.title}>Authentification</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        placeholdertextcolor="#FFF"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={[styles.input, { color: '#FFD700' }]}
        placeholder="Mot de passe"
        placeholdertextcolor="#FFD700"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Se connecter" onPress={handleLogin} />
            </View>
            </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
      marginBottom: 20,
    color: '#FFD700',
  },
  input: {
    color: '#FFFF', // Ajout de la virgule ici
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    background: {
    flex: 1,
    resizeMode: 'cover', 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
});

export default AuthScreen;