import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getBikeNameForId, getBikeNameMap } from '../utils/bikeNameManager';

const STATION_INFO_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_information.json';
const STATION_STATUS_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_status.json';
const FREE_BIKE_STATUS_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/free_bike_status.json';

interface Bike {
  bike_id: string;
  is_disabled?: boolean;
  is_reserved?: boolean;
  station_id?: string;
  lat?: number;
  lon?: number;
  vehicle_type_id?: string;
}
interface Station {
  station_id: string;
  name: string;
}

interface BikeWithDistance extends Bike {
  distance?: number | null;
}

export default function BikesStatsScreen() {
  const [search, setSearch] = useState('');
  const [selectedBike, setSelectedBike] = useState<string | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [bikeNameMap, setBikeNameMap] = useState(getBikeNameMap());
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortMode, setSortMode] = useState<'dispo' | 'distance' | 'prenom' | 'none'>('none');

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
        setStations(infoList);
        setBikes(bikesJson.data.bikes || []);
        setBikeNameMap(getBikeNameMap());
        // Récupère la position utilisateur
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        }
      } catch (e) {
        setStations([]);
        setBikes([]);
        setBikeNameMap(getBikeNameMap());
        setUserLocation(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStationsAndBikes();
    interval = setInterval(fetchStationsAndBikes, 10000); // 10 secondes
    return () => clearInterval(interval);
  }, []);

  // Fonction pour calculer la distance (en mètres) entre deux points GPS
  function getDistance(lat1?: number, lon1?: number, lat2?: number, lon2?: number) {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') return null;
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // Ajoute la distance à chaque vélo
  const bikesWithDistance: BikeWithDistance[] = useMemo(() => {
    if (!userLocation) return bikes;
    return bikes.map(bike => ({
      ...bike,
      distance: getDistance(userLocation.lat, userLocation.lon, bike.lat, bike.lon)
    }));
  }, [bikes, userLocation]);

  // Tri personnalisé
  const sortedBikes: BikeWithDistance[] = useMemo(() => {
    let arr = [...bikesWithDistance];
    if (sortMode === 'dispo') {
      arr.sort((a, b) => {
        // Dispo en haut, puis réservés, puis occupés
        const getScore = (bike: any) => (bike.is_disabled ? 2 : bike.is_reserved ? 1 : 0);
        return getScore(a) - getScore(b);
      });
    } else if (sortMode === 'distance') {
      arr.sort((a, b) => {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortMode === 'prenom') {
      arr.sort((a, b) => getBikeNameForId(a.bike_id, bikeNameMap).localeCompare(getBikeNameForId(b.bike_id, bikeNameMap)));
    }
    return arr;
  }, [bikesWithDistance, sortMode, bikeNameMap]);

  const filteredBikes = useMemo(() => {
    return sortedBikes.filter((bike: BikeWithDistance) => {
      const name = getBikeNameForId(bike.bike_id, bikeNameMap);
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || bike.bike_id.toLowerCase().includes(search.toLowerCase());
      const matchesStation = !selectedStationFilter || bike.station_id === selectedStationFilter;
      return matchesSearch && matchesStation;
    });
  }, [sortedBikes, search, bikeNameMap, selectedStationFilter]);

  function getStationName(stationId: string | undefined) {
    if (!stationId) return null;
    const station = stations.find((s: Station) => s.station_id === stationId);
    return station ? station.name : null;
  }

  // Fonction utilitaire pour afficher le type de vélo
  function getVehicleTypeLabel(typeId?: string) {
    switch (typeId) {
      case '1': return 'Vélo classique';
      case '2': return 'Vélo électrique';
      case '3': return 'Vélo cargo';
      case '4': return 'Vélo électrique';
      default: return 'Inconnu';
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2e7d32" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stats & Recherche Vélos</Text>
      <TextInput
        style={styles.input}
        placeholder="Rechercher un vélo (prénom ou ID)"
        value={search}
        onChangeText={setSearch}
      />
      <Picker
        selectedValue={selectedStationFilter}
        onValueChange={setSelectedStationFilter}
        style={{ marginBottom: 8 }}
      >
        <Picker.Item label="Toutes les stations" value="" />
        {stations.map(station => (
          <Picker.Item key={station.station_id} label={station.name} value={station.station_id} />
        ))}
      </Picker>
      <Picker
        selectedValue={sortMode}
        onValueChange={setSortMode}
        style={{ marginBottom: 16 }}
      >
        <Picker.Item label="Tri : Aucun" value="none" />
        <Picker.Item label="Tri : Disponibilité" value="dispo" />
        <Picker.Item label="Tri : Distance" value="distance" />
        <Picker.Item label="Tri : Prénom" value="prenom" />
      </Picker>
      <FlatList
        data={filteredBikes}
        keyExtractor={item => item.bike_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.bikeCard,
              (item.is_disabled || item.is_reserved) && { backgroundColor: '#ffcdd2', borderColor: '#b71c1c' }
            ]}
            onPress={() => setSelectedBike(item.bike_id)}
          >
            <Text style={styles.bikeName}>{getBikeNameForId(item.bike_id, bikeNameMap)}</Text>
            <Text>Statut : {item.is_disabled ? 'Occupé/désactivé' : item.is_reserved ? 'Réservé' : 'Libre'}</Text>
            <Text>Type : {getVehicleTypeLabel(item.vehicle_type_id)}</Text>
            {typeof item.distance === 'number' && (
              <Text>Distance : {item.distance} m</Text>
            )}
            {item.station_id && getStationName(item.station_id) && (
              <Text>En station : {getStationName(item.station_id)}</Text>
            )}
          </TouchableOpacity>
        )}
      />
      {selectedBike && (
        <View style={styles.bikeDetail}>
          <Text style={styles.bikeDetailTitle}>Fiche vélo</Text>
          {(() => {
            const bike = bikesWithDistance.find((b: BikeWithDistance) => b.bike_id === selectedBike);
            if (!bike) return <Text>Vélo introuvable</Text>;
            return (
              <>
                <Text style={styles.bikeName}>{getBikeNameForId(bike.bike_id, bikeNameMap)}</Text>
                <Text>ID : {bike.bike_id}</Text>
                <Text>Statut : {bike.is_disabled ? 'Occupé/désactivé' : bike.is_reserved ? 'Réservé' : 'Libre'}</Text>
                <Text>Type : {getVehicleTypeLabel(bike.vehicle_type_id)}</Text>
                {typeof bike.distance === 'number' && (
                  <Text>Distance : {bike.distance} m</Text>
                )}
                {bike.station_id && getStationName(bike.station_id) ? (
                  <Text>En station : {getStationName(bike.station_id)}</Text>
                ) : (
                  <Text style={{ color: 'orange' }}>Hors station</Text>
                )}
                {typeof bike.lat === 'number' && typeof bike.lon === 'number' && (
                  <Text>Coordonnées : {bike.lat.toFixed(5)}, {bike.lon.toFixed(5)}</Text>
                )}
                <TouchableOpacity onPress={() => setSelectedBike(null)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bikeCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  bikeDetail: {
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
  bikeDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
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