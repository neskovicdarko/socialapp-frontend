import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import api from '../api';
import { useLoading } from '../context/LoadingContext';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setLoading } = useLoading();

  const register = async () => {
    setLoading(true);
    try {
      await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: password,
      });
      Alert.alert('Success', 'Account created. Please log in.');
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Registration failed', err.response?.data?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput placeholder="Name" onChangeText={setName} />
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Button title="Register" onPress={register} />
    </View>
  );
}