import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

const STATION_INFO_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_information.json';
const STATION_STATUS_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_status.json';

interface Station {
  station_id: string;
  name: string;
  address?: string;
  lat: number;
  lon: number;
  num_bikes_available?: number;
  num_docks_available?: number;
}

export default function MapScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const [infoRes, statusRes] = await Promise.all([
          fetch(STATION_INFO_URL),
          fetch(STATION_STATUS_URL),
        ]);
        const infoJson = await infoRes.json();
        const statusJson = await statusRes.json();
        const infoList: Station[] = infoJson.data.stations;
        const statusList = statusJson.data.stations;
        const statusMap = Object.fromEntries(statusList.map((s: any) => [s.station_id, s]));
        const merged: Station[] = infoList.map(station => ({
          ...station,
          num_bikes_available: statusMap[station.station_id]?.num_bikes_available || 0,
          num_docks_available: statusMap[station.station_id]?.num_docks_available || 0,
        }));
        setStations(merged);
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
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (e) {
        setStations([]);
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
    fetchStations();
  }, []);

  if (loading || !initialRegion) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2e7d32" />;

  return (
    <View style={styles.container}>
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
            onPress={() => setSelectedStation(station)}
            pinColor={station.num_bikes_available && station.num_bikes_available > 0 ? 'green' : 'red'}
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