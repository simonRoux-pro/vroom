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
}
interface Station {
  station_id: string;
  name: string;
}

export default function BikesStatsScreen() {
  const [search, setSearch] = useState('');
  const [selectedBike, setSelectedBike] = useState<string | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [bikeNameMap, setBikeNameMap] = useState(getBikeNameMap());

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
        // On recharge la mappe depuis le JSON (au cas où elle a changé)
        setBikeNameMap(getBikeNameMap());
      } catch (e) {
        setStations([]);
        setBikes([]);
        setBikeNameMap(getBikeNameMap());
      } finally {
        setLoading(false);
      }
    };
    fetchStationsAndBikes();
    interval = setInterval(fetchStationsAndBikes, 10000); // 10 secondes
    return () => clearInterval(interval);
  }, []);

  const filteredBikes = useMemo(() => {
    return bikes.filter((bike: Bike) => {
      const name = getBikeNameForId(bike.bike_id, bikeNameMap);
      return name.toLowerCase().includes(search.toLowerCase()) || bike.bike_id.toLowerCase().includes(search.toLowerCase());
    });
  }, [bikes, search, bikeNameMap]);

  function getStationName(stationId: string | undefined) {
    if (!stationId) return null;
    const station = stations.find((s: Station) => s.station_id === stationId);
    return station ? station.name : null;
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
      <FlatList
        data={filteredBikes}
        keyExtractor={item => item.bike_id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.bikeCard} onPress={() => setSelectedBike(item.bike_id)}>
            <Text style={styles.bikeName}>{getBikeNameForId(item.bike_id, bikeNameMap)}</Text>
            <Text>Statut : {item.is_disabled ? 'Occupé/désactivé' : item.is_reserved ? 'Réservé' : 'Libre'}</Text>
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
            const bike = bikes.find((b: Bike) => b.bike_id === selectedBike);
            if (!bike) return <Text>Vélo introuvable</Text>;
            return (
              <>
                <Text style={styles.bikeName}>{getBikeNameForId(bike.bike_id, bikeNameMap)}</Text>
                <Text>Statut : {bike.is_disabled ? 'Occupé/désactivé' : bike.is_reserved ? 'Réservé' : 'Libre'}</Text>
                {bike.station_id && getStationName(bike.station_id) && (
                  <Text>En station : {getStationName(bike.station_id)}</Text>
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