import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useLoading } from '../context/LoadingContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setLoading } = useLoading();

  const login = async () => {
    setLoading(true);

    try {
      const res = await api.post('/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      navigation.replace('MainApp');
    } catch (err: any) {
      Alert.alert('Login failed', err.response?.data?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Button title="Login" onPress={login} />
      <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}
