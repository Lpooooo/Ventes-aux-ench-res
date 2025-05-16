import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const ProductScreen = ({ route }) => {
  const {
    image = require('../assets/Web-Application-Components-Models.png'),
    name = 'Nom du produit',
    description = 'Description non disponible',
    initialPrice = 0,
    currentPrice: passedPrice = 0,
    dateEnd = new Date(),
  } = route.params || {};

  const [currentPrice, setCurrentPrice] = useState(passedPrice);

  const validDateEnd = new Date(dateEnd);

  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.price}>Prix actuel : €{(currentPrice / 100).toFixed(2)}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentPrice(prev => prev + 1000)}
        >
          <Text style={styles.buttonText}>↥ Augmenter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentPrice(prev => (prev > 1000 ? prev - 1000 : prev))}
        >
          <Text style={styles.buttonText}>↧ Réduire</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.date}>
        Fin de l'enchère : {validDateEnd.toLocaleString() || 'Date non disponible'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  image: { width: 250, height: 250, marginBottom: 20 },
  name: { fontSize: 20, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#666', marginVertical: 10, textAlign: 'center' },
  price: { fontSize: 18, marginVertical: 10 },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    justifyContent: 'space-between',
    width: '80%',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  date: { fontSize: 12, color: '#999' },
});

export default ProductScreen;