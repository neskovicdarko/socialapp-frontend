import React, { useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import api from '../api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ForgotPasswordScreen = () => {
  const [step, setStep] = useState(1); // 1=email, 2=code+password, 3=success
  const [isError, setIsError] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const codeInputs = useRef<Array<TextInput | null>>([]);

  const handleSendCode = async () => {
    if (!email) {
      setIsError(true);
      setInfoMessage('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.post('/forgot-password-code', { email });
      setStep(2);
      setIsError(false);
      setInfoMessage(`Verification code sent to ${email}`);
    } catch {
      setIsError(true);
      setInfoMessage('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const codeString = code.join('');
    if (codeString.length < 6 || !password || !passwordConfirmation) {
      setIsError(true);
      setInfoMessage('Please fill out all fields');
      return;
    }

    if (password !== passwordConfirmation) {
      setIsError(true);
      setInfoMessage('Code that is entered is wrong or the passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reset-password-code', {
        email,
        code: codeString,
        password,
        password_confirmation: passwordConfirmation,
      });

      setIsError(false);
      setStep(3); // step 3 = success screen
      setInfoMessage('Password changed successfully!');
      setEmail('');
      setCode(['', '', '', '', '', '']);
      setPassword('');
      setPasswordConfirmation('');

      setTimeout(() => navigation.navigate('Login'), 3000);
    } catch {
      setIsError(true);
      setInfoMessage('Code that is entered is wrong or the passwords do not match!');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return; // samo cifre
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) codeInputs.current[index + 1]?.focus();
    if (!text && index > 0) codeInputs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      {infoMessage ? (
        <Text style={[styles.info, isError ? { color: 'red' } : { color: 'green' }]}>
          {infoMessage}
        </Text>
      ) : null}

      {step === 1 ? (
        <>
          <Text style={styles.subtitle}>
            Enter your email to receive a 6-digit verification code.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Code</Text>}
          </TouchableOpacity>
        </>
      ) : step === 2 ? (
        <>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to your email and your new password.
          </Text>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { codeInputs.current[index] = ref; }}
                style={styles.codeInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
              />
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={styles.backToLogin}>Back</Text>
          </TouchableOpacity>
        </>
      ) : (
        // step 3 = success screen
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ {infoMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '600', textAlign: 'center', marginBottom: 10, color: '#222' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#555' },
  info: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 14, borderRadius: 10, fontSize: 16, marginBottom: 20, backgroundColor: '#f9f9f9', color: '#333' },
  codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  codeInput: { borderWidth: 1, borderColor: '#ccc', padding: 14, borderRadius: 10, fontSize: 20, textAlign: 'center', width: 45, backgroundColor: '#f9f9f9', color: '#333' },
  button: { backgroundColor: '#00796B', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backToLogin: { textAlign: 'center', color: '#00796B', fontSize: 16, fontWeight: '600' },
  successContainer: {
    backgroundColor: '#E6F8EC',
    borderLeftWidth: 6,
    borderLeftColor: '#28A745',
    padding: 14,
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  successText: {
    color: '#155724',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;
