// นำเข้า React และ useState สำหรับเก็บค่าในหน้าจอ ( state )
import React, { useState } from 'react';
// นำเข้าคอมโพเนนต์พื้นฐานสำหรับสร้างหน้าตา UI จาก React Native
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// นำเข้า useRouter สำหรับใช้เปลี่ยนหน้าจอ
import { useRouter } from 'expo-router';
// นำเข้า Context ส่วนกลางสำหรับเรียกใช้ฟังก์ชันล็อกอิน
import { useAuth } from './AuthContext';
// นำเข้า SafeAreaView ช่วยเว้นระยะขอบหน้าจอ
import { SafeAreaView } from 'react-native-safe-area-context';

// ===================================================
// 🖥️ [FRONTEND] 5. หน้า LOGIN (คอมโพเนนต์เข้าสู่ระบบ - TECH THEME)
// ===================================================
export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  // 🚀 ฟังก์ชันทำงานเมื่อผู้ใช้กดปุ่ม "Log In"
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอก Username และ Password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://119.59.102.161:3028/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.user, data.token);
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* โลโก้แบรนด์ร้าน Powerbank */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>⚡</Text>
          <Text style={styles.brandTitle}>POWERVAULT</Text>
          <Text style={styles.brandSubtitle}>Powerbank E-Commerce Store</Text>
        </View>

        {/* ฟอร์มเข้าสู่ระบบ */}
        <View style={styles.card}>
          <Text style={styles.title}>เข้าสู่ระบบ (Sign In)</Text>
          <Text style={styles.subtitle}>กรุณาเข้าสู่ระบบเพื่อใช้งาน</Text>

          <View style={styles.form}>
            {/* ช่องกรอก Username */}
            <Text style={styles.label}>ชื่อผู้ใช้ (Username)</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกชื่อผู้ใช้..."
              placeholderTextColor="#64748B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            
            {/* ช่องกรอก Password */}
            <Text style={styles.label}>รหัสผ่าน (Password)</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกรหัสผ่าน..."
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* ปุ่มกดเข้าสู่ระบบ */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ ⚡'}
              </Text>
            </TouchableOpacity>

            {/* ลิงก์สำหรับเปลี่ยนไปหน้าสมัครสมาชิก */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>ยังไม่มีบัญชีลูกค้า? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>สมัครสมาชิกใหม่</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// 🎨 สไตล์ธีม Cyberpunk Tech สวยงามสำหรับหน้า Login
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#06B6D4',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  form: {
    gap: 14,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F8FAFC',
  },
  loginButton: {
    backgroundColor: '#06B6D4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#475569',
  },
  loginButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  registerLink: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '700',
  },
});
