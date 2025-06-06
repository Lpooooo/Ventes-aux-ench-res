import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import styles from './Stylesmobile';
import { useNavigation } from '@react-navigation/native';

const DesignComponent = () => {

const productDefault = { uri: '../assets/image.png' }; // Image par défaut en ligne
  const products = [
    {
      _id: '1',
      image: productDefault,
      name: 'Produit 1',
      description: 'Description du produit 1',
      initialPrice: 10000,
      currentPrice: 12000,
      dateEnd: new Date(2025, 2, 19, 0, 30),
    },
    {
      _id: '2',
      image: productDefault,
      name: 'Produit 2',
      description: 'Description du produit 2',
      initialPrice: 20000,
      currentPrice: 25000,
      dateEnd: new Date(2025, 3, 20, 12, 0),
    },
    {
      _id: '3',
      image: productDefault,
      name: 'Produit 3',
      description: 'Description du produit 3',
      initialPrice: 15000,
      currentPrice: 18000,
      dateEnd: new Date(2025, 4, 15, 18, 0),
      },
    {
      _id: '4',
      image: productDefault,
      name: 'Produit 4',
      description: 'Description du produit 3',
      initialPrice: 15000,
      currentPrice: 18000,
      dateEnd: new Date(2025, 4, 15, 18, 0),
      },
    {
      _id: '5',
      image: productDefault,
      name: 'Produit 5',
      description: 'Description du produit 3',
      initialPrice: 15000,
      currentPrice: 18000,
      dateEnd: new Date(2025, 4, 15, 18, 0),
      },
    {
      _id: '6',
      image: productDefault,
      name: 'Produit 6',
      description: 'Description du produit 3',
      initialPrice: 15000,
      currentPrice: 18000,
      dateEnd: new Date(2025, 4, 15, 18, 0),
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Design Component</Text>
      <View style={styles.annonceContainer}>
        {products.map((product) => (
          <Annonce key={product._id} {...product} />
        ))}
      </View>
    </ScrollView>
  );
};

const Annonce = ({ image, name, description, initialPrice, currentPrice, dateEnd }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.annonce}
      onPress={() =>
        navigation.navigate('Product', {
          image,
          name,
          description,
          initialPrice,
          currentPrice,
          dateEnd,
        })
      }
    >
      <Image source={image} style={styles.productImage} />
      <Text style={styles.productName}>{name}</Text>
      <Text style={styles.productDescription}>{description}</Text>
      <Text style={styles.productPrice}>
        €{(currentPrice / 100).toFixed(2)}{' '}
        <Text style={styles.initialPrice}>€{(initialPrice / 100).toFixed(2)}</Text>
      </Text>
      <Text style={styles.dateEnd}>End Date: {dateEnd.toLocaleDateString()}</Text>
    </TouchableOpacity>
  );
};

export default DesignComponent;