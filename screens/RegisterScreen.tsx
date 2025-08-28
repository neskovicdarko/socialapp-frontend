import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import api from '../api';
import { useLoading } from '../context/LoadingContext';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setLoading } = useLoading();

  const validateEmailFormat = (value: string) => {
    const regex = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
    return regex.test(value);
  };

  const validatePasswordFormat = (value: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_]).{10,}$/;
    return regex.test(value);
  };

  const checkEmailUnique = async () => {
    if (!email) return;
    if (!validateEmailFormat(email)) {
      setEmailError('Invalid email format');
      return;
    }
    try {
      const res = await api.post('/check-email', { email });
      if (!res.data.unique) {
        setEmailError('Email is already taken');
      } else {
        setEmailError('');
      }
    } catch (err: any) {
      setEmailError('Could not validate email');
    }
  };

  const checkPasswordValid = () => {
    if (!password) return;
    if (!validatePasswordFormat(password)) {
      setPasswordError(
        'Password must be at least 10 characters, contain a letter, a number and a special character'
      );
    } else {
      setPasswordError('');
    }
  };

  const hasErrors = () => {
    return (
      !name.trim() ||
      !!emailError ||
      !!passwordError ||
      !validateEmailFormat(email) ||
      !validatePasswordFormat(password)
    );
  };

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
      Alert.alert(
        'Registration failed',
        err.response?.data?.message || 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderWidth: 2,
        borderColor: 'black',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 10, // da bude iznad ostalih elemenata
      }}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
      <Text style={styles.title}>Join Us 👋</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, emailError ? { borderColor: 'red' } : null]}
          placeholder="Enter your email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError('');
          }}
          onBlur={checkEmailUnique}
        />
        {emailError ? (
          <Text style={styles.errorText}>{emailError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[
            styles.input,
            passwordError ? { borderColor: 'red' } : null,
          ]}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          onBlur={checkPasswordValid}
        />
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.button, hasErrors() ? { opacity: 0.5 } : null]}
        onPress={register}
        disabled={hasErrors()}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.secondaryButtonText}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 32,
    color: '#222',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#00796B',
    fontWeight: '600',
  },
});
