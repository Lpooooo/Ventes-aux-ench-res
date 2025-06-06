
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const CreateAction = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [initialPrice, setInitialPrice] = useState('');

  const handleCreateAuction = () => {
    if (!name || !description || !initialPrice) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    // Logique pour créer une vente aux enchères (par exemple, envoyer les données au backend)
    alert('Vente aux enchères créée avec succès !');
    navigation.goBack(); // Retourne à l'écran précédent
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer une vente aux enchères</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom du produit"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Prix initial (€)"
        value={initialPrice}
        onChangeText={setInitialPrice}
        keyboardType="numeric"
      />
      <Button title="Créer" onPress={handleCreateAuction} />
    </View>
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
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default CreateAction;