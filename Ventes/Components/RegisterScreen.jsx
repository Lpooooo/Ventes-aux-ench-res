import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleRegister = async () => {
    if (!firstName || !lastName || !username || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    try {
      const response = await fetch('http://10.0.2.2:3443/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Succès', 'Compte créé ! Vérifiez votre email pour valider votre compte.');
        navigation.replace('Auth'); // Retour à l'écran de connexion
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      <TextInput
        style={styles.input}
        placeholder="Prénom"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="S'inscrire" onPress={handleRegister} />
      <TouchableOpacity onPress={() => navigation.replace('Auth')}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
    letterSpacing: 2,
    textAlign: 'center',
  },
  input: {
    color: '#000',
    width: '90%',
    padding: 16,
    fontSize: 20,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  link: {
    color: '#000',
    marginTop: 16,
    textDecorationLine: 'underline',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default RegisterScreen;