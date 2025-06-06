import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Button, StyleSheet, View } from 'react-native';
import Authscreen from './Components/AuthScreen';
import DesignComponent from './Components/DesignComponent'; 
import ProductScreen from './Components/ProductScreen'; 
import ProfileScreen from './Components/ProfileScreen'; 
import CreateAction from './Components/CreateAction';
import MySellingScreen from './Components/MySellingScreen';
import MyBiddingScreen from './Components/MyBiddingScreen';
import RegisterScreen from './Components/RegisterScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        {/* Écran d'authentification */}
        <Stack.Screen
          name="Auth"
          component={Authscreen}
          options={{ headerShown: false }} // Masque l'en-tête pour l'écran d'authentification
        />
        {/* Écran principal (liste des produits) */}
        <Stack.Screen
          name="Products"
          component={DesignComponent}
          options={({ navigation }) => ({
            title: 'Produits',
            headerRight: () => (
              <View style={styles.headerButtons}>
                <Button
                  onPress={() => navigation.navigate('Profile')}
                  title="Profil"
                  color="#007BFF"
                />
                <View style={styles.buttonSpacing}>
                  <Button
                    onPress={() => navigation.navigate('Create')}
                    title="Create"
                    color="#007BFF"
                  />
                </View>
              </View>
            ),
          })}
        />
        {/* Écran des détails d'un produit */}
        <Stack.Screen
          name="Product"
          component={ProductScreen}
          options={{ title: 'Détails du produit' }}
        />
        {/* Écran de profil */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Modifier le profil' }}
        />
          <Stack.Screen
          name="Create"
          component={CreateAction}
          options={{ title: 'Créer une vente' }}
        />
  <Stack.Screen name="MySelling" component={MySellingScreen} options={{ title: 'Mes ventes' }} />
        <Stack.Screen name="MyBidding" component={MyBiddingScreen} options={{ title: 'Mes enchères' }} />
        <Stack.Screen
  name="Register"
  component={RegisterScreen}
  options={{ title: "S'inscrire" }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row', 
    marginRight: 10, 
  },
    buttonSpacing: {
    marginLeft: 10, 
  },
});