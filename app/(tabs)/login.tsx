import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.sigma.fifteen.eu/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp_mode: 0 })
      });
      const data = await response.json();
      if (data.ok) {
        setStep('otp');
        Alert.alert('Code envoyé', 'Un code a été envoyé par SMS.');
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de la demande de code.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.sigma.fifteen.eu/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, otp_mode: 0 })
      });
      const data = await response.json();
      if (data.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);
        Alert.alert('Succès', 'Connecté !');
        setStep('phone');
        setOtp('');
      } else {
        Alert.alert('Erreur', data.message || 'Code incorrect ou expiré.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion Vélivert</Text>
      {step === 'phone' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <Button title={loading ? 'Envoi...' : 'Recevoir un code'} onPress={handleLogin} disabled={loading || !phone} />
        </>
      ) : (
        <>
          <Text style={{ marginBottom: 8 }}>Code envoyé à {phone}</Text>
          <TextInput
            style={styles.input}
            placeholder="Code reçu par SMS"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            autoCapitalize="none"
            maxLength={6}
          />
          <Button title={loading ? 'Vérification...' : 'Valider le code'} onPress={handleVerifyOtp} disabled={loading || otp.length !== 6} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#2e7d32',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    backgroundColor: '#fff',
    fontSize: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 