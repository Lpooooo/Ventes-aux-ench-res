import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Button, Alert,StyleSheet } from 'react-native';
/* import styles from './Stylesmobile'; */
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'http://10.0.2.2:3443/api/auctions';

const DesignComponent = () => {
  const navigation = useNavigation();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [mySelling, setMySelling] = useState([]);
  const [myBidding, setMyBidding] = useState([]);
  const [token, setToken] = useState(''); // à récupérer depuis le login
  // Récupérer le token au montage
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) setToken(storedToken);
    };loadToken();
    fetchAuctions();
  }, []);
  // 1. Récupérer toutes les enchères
  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}`);
      const data = await res.json();
      setAuctions(data.auctions || []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les enchères');
    }
    setLoading(false);
  };

  // 2. Récupérer une enchère par ID
  const fetchAuctionById = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`);
      const data = await res.json();
      setSelectedAuction(data.auction || null);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger cette enchère');
    }
    setLoading(false);
  };

  // 3. Chercher des enchères
  const searchAuctions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(search)}`);
      const data = await res.json();
      setAuctions(data.auctions || []);
    } catch (e) {
      Alert.alert('Erreur', 'Recherche impossible');
    }
    setLoading(false);
  };

  // 4. Mes enchères en vente
  const fetchMySelling = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/selling`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMySelling(data.auctions || []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger vos ventes');
    }
    setLoading(false);
  };

  // 5. Mes enchères où j’ai enchéri
  const fetchMyBidding = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/bidding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMyBidding(data.auctions || []);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger vos enchères');
    }
    setLoading(false);
  };

  // 6. Placer une enchère
  const placeBid = async (auctionId, amount) => {
    console.log(token)
    try {
      const res = await fetch(`${API_URL}/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Succès', data.message || 'Enchère placée');
        fetchAuctions();
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de l\'enchère');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de placer une enchère');
    }
  };

  // 7. Créer une enchère (exemple simplifié)
  const createAuction = async (auctionData) => {
    try {
      const res = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(auctionData)
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Succès', data.message || 'Enchère créée');
        fetchAuctions();
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de la création');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer une enchère');
    }
  };

  // 8. Modifier une enchère (exemple simplifié)
  const updateAuction = async (auctionId, auctionData) => {
    try {
      const res = await fetch(`${API_URL}/${auctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(auctionData)
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Succès', data.message || 'Enchère modifiée');
        fetchAuctions();
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de la modification');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de modifier l\'enchère');
    }
  };

  // 9. Supprimer une enchère
  const deleteAuction = async (auctionId) => {
    try {
      const res = await fetch(`${API_URL}/${auctionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Succès', data.message || 'Enchère supprimée');
        fetchAuctions();
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de la suppression');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de supprimer l\'enchère');
    }
  };

  // 10. Terminer une enchère (admin)
  const finishAuction = async (auctionId) => {
    try {
      const res = await fetch(`${API_URL}/${auctionId}/finish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Succès', data.message || 'Enchère terminée');
        fetchAuctions();
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de la finalisation');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de terminer l\'enchère');
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchAuctions();
  }, []);

  // UI d’exemple (à adapter selon ton design)
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ventes aux enchères</Text>
      <TextInput
        style={styles.input}
        placeholder="Rechercher une enchère"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={searchAuctions}
      />
      <Button title="Rechercher" onPress={searchAuctions} />
<View style={{ height: 12 }} />
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <View style={styles.annonceContainer}>
          {auctions.map((auction) => (
            <TouchableOpacity
              key={auction._id}
              style={styles.annonce}
              onPress={() => fetchAuctionById(auction._id)}
            >
             <Image
  source={auction.imageUrl ? { uri: auction.imageUrl } : null}
  style={styles.productImage}
/>
              <Text style={styles.productName}>{auction.title}</Text>
              <Text style={styles.productDescription}>{auction.description}</Text>
              <Text style={styles.productPrice}>
                Prix actuel : €{(auction.currentPrice / 100).toFixed(2)}
              </Text>
              <Text style={styles.dateEnd}>
                Fin : {new Date(auction.endDate).toLocaleString()}
              </Text>
              <Text style={styles.status}>
                Statut : {auction.status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Exemple d'affichage d'une enchère sélectionnée */}
      {selectedAuction && (
        <View style={styles.selectedAuction}>
          <Text style={styles.title2}>{selectedAuction.title}</Text>
          <Text>{selectedAuction.description}</Text>
          <Text>Prix actuel : €{(selectedAuction.currentPrice / 100).toFixed(2)}</Text>
          <Text>Fin : {new Date(selectedAuction.endDate).toLocaleString()}</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre enchère (€)"
            value={bidAmount}
            onChangeText={setBidAmount}
            keyboardType="numeric"
          />
          <Button
            title="Placer une enchère"
            onPress={() => placeBid(selectedAuction._id, parseFloat(bidAmount) * 100)}
          />
          <View style={{ height: 12 }} />
          <Button
            title="Fermer"
            onPress={() => setSelectedAuction(null)}
            color="red"
          />
        </View>
      )}

      {/* Boutons pour voir mes ventes et mes enchères */}
<Button title="Mes ventes" onPress={() => navigation.navigate('MySelling')} />
<View style={{ height: 12 }} />
<Button title="Mes enchères" onPress={() => navigation.navigate('MyBidding')} />
      {/* Affichage des ventes et enchères de l'utilisateur */}
      {mySelling.length > 0 && (
        <View>
          <Text style={styles.title2}>Mes ventes</Text>
          {mySelling.map((auction) => (
            <Text key={auction._id}>{auction.title}</Text>
          ))}
        </View>
      )}
      {myBidding.length > 0 && (
        <View>
          <Text style={styles.title2}>Mes enchères</Text>
          {myBidding.map((auction) => (
            <Text key={auction._id}>{auction.title}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f7f7f7',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  annonceContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  annonce: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    color: '#007BFF',
    marginBottom: 2,
  },
  initialPrice: {
    fontSize: 14,
    color: '#888',
  },
  dateEnd: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  selectedAuction: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginVertical: 18,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  title2: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
    textAlign: 'center',
  },
});

export default DesignComponent;