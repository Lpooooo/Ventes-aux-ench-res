import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3443/api/auctions';

const MyBiddingScreen = () => {
  const [myBidding, setMyBidding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const loadTokenAndData = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
      const res = await fetch(`${API_URL}/user/bidding`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      const data = await res.json();
      setMyBidding(data.auctions || []);
      setLoading(false);
    };
    loadTokenAndData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mes enchères</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : myBidding.length === 0 ? (
        <Text>Aucune enchère en cours.</Text>
      ) : (
        myBidding.map((auction) => (
          <View key={auction._id} style={styles.annonce}>
            <Text style={styles.productName}>{auction.title}</Text>
            <Text>{auction.description}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f7f7f7', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  annonce: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14 },
  productName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
});

export default MyBiddingScreen;