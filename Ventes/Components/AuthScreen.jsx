import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [showReset, setShowReset] = useState(false); // Ajouté

  const handleLogin = async () => {
    try {
      const response = await fetch('http://10.0.2.2:3443/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('token', data.accessToken);
        navigation.replace('Products');
      } else {
        Alert.alert('Erreur', data.message || 'Erreur de connexion');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Erreur', 'Veuillez saisir votre email.');
      return;
    }
    const response = await fetch('http://10.0.2.2:3443/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const data = await response.json();
    Alert.alert('Info', data.message);
    setShowForgot(false);
    setForgotEmail('');
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    try {
      const response = await fetch(`http://10.0.2.2:3443/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();
      Alert.alert('Info', data.message);
      if (response.ok) {
        setShowReset(false);
        setToken('');
        setNewPassword('');
        navigation.replace('Auth');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const handleVerifyEmail = async () => {
    if (!verifyToken) {
      Alert.alert('Erreur', 'Veuillez saisir le token de vérification.');
      return;
    }
    try {
      const response = await fetch(`http://10.0.2.2:3443/api/auth/verify-email/${verifyToken}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      Alert.alert('Info', data.message);
      if (response.ok) {
        setShowVerify(false);
        setVerifyToken('');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/Web-Application-Components-Models.png')}
      style={styles.background}
    >
      {/* Connexion */}
      {!showForgot && !showVerify && !showReset && (
        <View style={styles.container}>
          <Text style={styles.title}>Authentification</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#FFF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#FFF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Se connecter" onPress={handleLogin} />
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.link}>Créer un compte</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowForgot(true)}>
            <Text style={styles.link}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowVerify(true)}>
            <Text style={styles.link}>Vérifier mon email</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowReset(true)}>
            <Text style={styles.link}>Réinitialiser le mot de passe</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mot de passe oublié */}
      {showForgot && !showVerify && !showReset && (
        <View style={styles.container}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre email"
            placeholderTextColor="#FFF"
            value={forgotEmail}
            onChangeText={setForgotEmail}
            autoCapitalize="none"
          />
          <Button title="Envoyer" onPress={handleForgotPassword} />
          <TouchableOpacity onPress={() => setShowForgot(false)}>
            <Text style={styles.link}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Vérification email */}
      {showVerify && !showReset && (
        <View style={styles.verifyContainer}>
          <Text style={styles.title2}>Vérification de l'email</Text>
          <TextInput
            style={styles.input2}
            placeholder="Token de vérification"
            value={verifyToken}
            onChangeText={setVerifyToken}
            autoCapitalize="none"
          />
          <Button title="Vérifier" onPress={handleVerifyEmail} />
          <TouchableOpacity onPress={() => setShowVerify(false)}>
            <Text style={styles.link}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Réinitialisation du mot de passe */}
      {showReset && (
        <View style={styles.container}>
          <Text style={styles.title}>Réinitialiser le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Token reçu par email"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Button title="Réinitialiser" onPress={handleResetPassword} />
          <TouchableOpacity onPress={() => setShowReset(false)}>
            <Text style={styles.link}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
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
    fontSize: 32,
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
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title2: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#000',
    letterSpacing: 2,
    textAlign: 'center',
  },
  input2: {
    width: '90%',
    padding: 16,
    fontSize: 20,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 10,
    marginBottom: 20,
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
});

export default AuthScreen;