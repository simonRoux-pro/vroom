// Nécessite : npx expo install @react-native-async-storage/async-storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import bikeNames from '../../bikeNames.json';

// Liste de prénoms à attribuer
const bikeNamesList = [
  'Jean', 'Marie', 'Luc', 'Sophie', 'Paul', 'Emma', 'Louis', 'Julie', 'Hugo', 'Chloé',
  'Lucas', 'Léa', 'Maxime', 'Camille', 'Nathan', 'Sarah', 'Tom', 'Manon', 'Enzo', 'Lina',
  'Noah', 'Jade', 'Léo', 'Anna', 'Gabriel', 'Eva', 'Raphaël', 'Zoé', 'Arthur', 'Alice',
  'Mathis', 'Léna', 'Ethan', 'Lou', 'Maël', 'Rose', 'Sacha', 'Mila', 'Axel', 'Nina',
  'Jules', 'Louna', 'Adam', 'Ambre', 'Aaron', 'Inès', 'Victor', 'Iris', 'Martin', 'Maya'
];

export type BikeNameMap = Record<string, string>;

const STORAGE_KEY = 'bikeNamesMap';

// Lecture synchrone (fallback initiale, lecture du JSON du projet)
export function loadBikeNames(): BikeNameMap {
  return bikeNames as BikeNameMap;
}

// Lecture asynchrone depuis le stockage local
export async function loadBikeNamesAsync(): Promise<BikeNameMap> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value) {
      return JSON.parse(value);
    }
    return bikeNames as BikeNameMap;
  } catch (e) {
    return bikeNames as BikeNameMap;
  }
}

// Sauvegarde asynchrone dans le stockage local
export async function saveBikeNamesAsync(map: BikeNameMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    // Erreur silencieuse
  }
}

// Fonction de hash simple pour obtenir un index stable à partir d'un ID
function hashIdToIndex(id: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash) % max;
}

// Attribution stricte : 1 ID = 1 prénom, selon le JSON
export function getBikeNameForId(bikeId: string, map: BikeNameMap = bikeNames as BikeNameMap): string {
  return map[bikeId] || bikeId;
}

export function getBikeNameMap(): BikeNameMap {
  return bikeNames as BikeNameMap;
}

export default {}; 