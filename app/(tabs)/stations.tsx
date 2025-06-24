import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

interface StationInfo {
  station_id: string;
  name: string;
  address?: string;
  lat: number;
  lon: number;
}

interface StationStatus {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
}

interface Station {
  station_id: string;
  name: string;
  address?: string;
  num_bikes_available: number;
  num_docks_available: number;
}

const STATION_INFO_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_information.json';
const STATION_STATUS_URL = 'https://api.saint-etienne-metropole.fr/velivert/api/station_status.json';

export default function StationsScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const [infoRes, statusRes] = await Promise.all([
          fetch(STATION_INFO_URL),
          fetch(STATION_STATUS_URL),
        ]);
        const infoJson = await infoRes.json();
        const statusJson = await statusRes.json();
        console.log('infoJson', infoJson);
        console.log('statusJson', statusJson);
        const infoList: StationInfo[] = infoJson.data.stations;
        const statusList: StationStatus[] = statusJson.data.stations;
        const statusMap = Object.fromEntries(statusList.map(s => [s.station_id, s]));
        const merged: Station[] = infoList.map(station => ({
          station_id: station.station_id,
          name: station.name,
          address: station.address,
          num_bikes_available: statusMap[station.station_id]?.num_bikes_available || 0,
          num_docks_available: statusMap[station.station_id]?.num_docks_available || 0,
        }));
        setStations(merged);
      } catch (e) {
        setError('Erreur lors du chargement des stations.');
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2e7d32" />;
  if (error) return <Text style={{ color: 'red', margin: 20 }}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stations Vélivert</Text>
      <FlatList
        data={stations}
        keyExtractor={item => item.station_id}
        renderItem={({ item }) => (
          <View style={styles.stationCard}>
            <Text style={styles.stationName}>{item.name}</Text>
            {item.address && <Text style={styles.stationAddress}>{item.address}</Text>}
            <Text>Vélos disponibles : {item.num_bikes_available}</Text>
            <Text>Places libres : {item.num_docks_available}</Text>
          </View>
        )}
      />
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
  stationCard: {
    backgroundColor: '#f1f8e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388e3c',
  },
  stationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 