import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import pointBleu from '../../assets/images/point-bleu.png';
import pointGris from '../../assets/images/point-gris.png';
import pointOrange from '../../assets/images/point-orange.png';

const STATION_INFO_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_information.json';
const STATION_STATUS_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_status.json';
const FREE_BIKE_STATUS_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/free_bike_status.json';

interface Station {
  station_id: string;
  name: string;
  address?: string;
  lat: number;
  lon: number;
  num_bikes_available?: number;
  num_docks_available?: number;
}

interface Bike {
  bike_id: string;
  lat: number;
  lon: number;
  is_reserved?: boolean;
  is_disabled?: boolean;
  vehicle_type_id?: string;
  station_id?: string;
}

export default function MapScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    let interval: number;
    const fetchStationsAndBikes = async () => {
      try {
        const [infoRes, statusRes, bikesRes] = await Promise.all([
          fetch(STATION_INFO_URL),
          fetch(STATION_STATUS_URL),
          fetch(FREE_BIKE_STATUS_URL),
        ]);
        const infoJson = await infoRes.json();
        const statusJson = await statusRes.json();
        const bikesJson = await bikesRes.json();
        const infoList: Station[] = infoJson.data.stations;
        const statusList = statusJson.data.stations;
        const statusMap = Object.fromEntries(statusList.map((s: any) => [s.station_id, s]));
        const merged: Station[] = infoList.map(station => ({
          ...station,
          num_bikes_available: statusMap[station.station_id]?.num_bikes_available || 0,
          num_docks_available: statusMap[station.station_id]?.num_docks_available || 0,
        }));
        setStations(merged);
        setBikes(bikesJson.data.bikes || []);
        // Demander la localisation de l'utilisateur
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Si refus, centrer sur la première station
          if (merged.length > 0) {
            setInitialRegion({
              latitude: merged[0].lat,
              longitude: merged[0].lon,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            });
          }
          return;
        }
        const userLocation = await Location.getCurrentPositionAsync({});
        // Trouver la station la plus proche
        let closest = merged[0];
        let minDist = Number.MAX_VALUE;
        merged.forEach(station => {
          const dist = Math.sqrt(
            Math.pow(station.lat - userLocation.coords.latitude, 2) +
            Math.pow(station.lon - userLocation.coords.longitude, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            closest = station;
          }
        });
        setInitialRegion({
          latitude: closest.lat,
          longitude: closest.lon,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (e) {
        setStations([]);
        setBikes([]);
        setInitialRegion({
          latitude: 45.4397,
          longitude: 4.3872,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
      } finally {
        setLoading(false);
      }
    };
    // Première récupération + intervalle
    fetchStationsAndBikes();
    interval = setInterval(fetchStationsAndBikes, 1000); // 1 seconde
    return () => clearInterval(interval);
  }, []);

  if (loading || !initialRegion) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2e7d32" />;

  // Liste de prénoms pour les vélos
  const bikeNames = [
    'Jean', 'Marie', 'Luc', 'Sophie', 'Paul', 'Emma', 'Louis', 'Julie', 'Hugo', 'Chloé',
    'Lucas', 'Léa', 'Maxime', 'Camille', 'Nathan', 'Sarah', 'Tom', 'Manon', 'Enzo', 'Lina',
    'Noah', 'Jade', 'Léo', 'Anna', 'Gabriel', 'Eva', 'Raphaël', 'Zoé', 'Arthur', 'Alice',
    'Mathis', 'Léna', 'Ethan', 'Lou', 'Maël', 'Rose', 'Sacha', 'Mila', 'Axel', 'Nina',
    'Jules', 'Louna', 'Adam', 'Ambre', 'Aaron', 'Inès', 'Victor', 'Iris', 'Martin', 'Maya'
  ];
  // Génère un prénom pour chaque vélo à partir de son ID
  function getBikeName(bikeId: string) {
    // On prend les 6 derniers chiffres/lettres, on les convertit en base 36 puis modulo la taille du tableau
    const num = parseInt(bikeId.slice(-6), 36);
    return bikeNames[num % bikeNames.length];
  }
  // Trouver le nom de la station associée à un vélo
  function getStationName(stationId: string | undefined) {
    if (!stationId) return null;
    const station = stations.find(s => s.station_id === stationId);
    return station ? station.name : null;
  }

  return (
    <View style={styles.container}>
      {/* Compteur vélos */}
      <View style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, alignItems: 'center' }}>
        {bikes.length > 0 && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 16, flexDirection: 'row', gap: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontWeight: 'bold', color: '#222' }}>Vélos : {bikes.length}</Text>
            <Text style={{ color: 'orange' }}>Réservés : {bikes.filter(b => b.is_reserved).length}</Text>
            <Text style={{ color: '#2196f3' }}>Libres : {bikes.filter(b => !b.is_reserved && !b.is_disabled).length}</Text>
            <Text style={{ color: '#888' }}>Occupés : {bikes.filter(b => b.is_disabled).length}</Text>
          </View>
        )}
      </View>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
      >
        {stations.map(station => (
          <Marker
            key={station.station_id}
            coordinate={{ latitude: station.lat, longitude: station.lon }}
            title={station.name}
            description={station.address}
            onPress={() => {
              setSelectedStation(station);
              setSelectedBike(null);
            }}
            pinColor={Number(station.num_bikes_available) > 0 ? 'green' : 'red'}
          />
        ))}
        {bikes
          .filter(bike =>
            typeof bike.lat === 'number' && typeof bike.lon === 'number' &&
            bike.lat > 40 && bike.lat < 50 && bike.lon > 0 && bike.lon < 10
          )
          .map(bike => (
            <Marker
              key={bike.bike_id}
              coordinate={{ latitude: bike.lat, longitude: bike.lon }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
              image={bike.is_disabled
                ? pointGris
                : bike.is_reserved
                  ? pointOrange
                  : pointBleu}
              onPress={() => {
                setSelectedBike(bike);
                setSelectedStation(null);
              }}
            />
          ))}
      </MapView>
      {selectedStation && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{selectedStation.name}</Text>
          {selectedStation.address && <Text style={styles.infoAddress}>{selectedStation.address}</Text>}
          <Text>Vélos disponibles : {selectedStation.num_bikes_available}</Text>
          <Text>Places libres : {selectedStation.num_docks_available}</Text>
          <TouchableOpacity onPress={() => setSelectedStation(null)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}
      {selectedBike && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Vélo {getBikeName(selectedBike.bike_id)}</Text>
          <Text>Statut : {selectedBike.is_disabled ? 'Occupé/désactivé' : selectedBike.is_reserved ? 'Réservé' : 'Libre'}</Text>
          {selectedBike.station_id && getStationName(selectedBike.station_id) && (
            <Text>En station : {getStationName(selectedBike.station_id)}</Text>
          )}
          <TouchableOpacity onPress={() => setSelectedBike(null)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  infoCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 