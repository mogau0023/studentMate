import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from './firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const WAVE_HEIGHT = 160;

function LogoHeader({ title }) {
  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <Image source={require('./assets/icon.png')} style={styles.logo} />
        <Text style={styles.logoText}>StudentMate</Text>
      </View>
      <Text style={styles.screenTitle}>{title}</Text>
    </View>
  );
}

function SectionTitle({ text }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function ModuleCard({ code, name, actionLabel, onPress }) {
  return (
    <View style={styles.cardRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardCode}>{code}</Text>
        <Text style={styles.cardName}>{name}</Text>
      </View>
      <TouchableOpacity onPress={onPress} style={styles.cardAction}>
        <Text style={styles.cardActionText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function AddModuleModal({ visible, onClose, onSubmit }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const handleAdd = () => {
    if (!code || !name) return;
    onSubmit({ code: code.trim().toUpperCase(), name: name.trim() });
    setCode('');
    setName('');
  };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Add Module</Text>
          <View style={{ marginTop: 12 }}>
            <Field
              label="Code"
              placeholder="e.g., COS132"
              value={code}
              onChangeText={setCode}
              iconName="tag"
            />
            <Field
              label="Name"
              placeholder="e.g., Computer Science 132"
              value={name}
              onChangeText={setName}
              iconName="book"
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalSecondary}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} style={styles.modalPrimary}>
              <Text style={styles.modalPrimaryText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ModulesScreen() {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [myModules, setMyModules] = useState([]);
  const user = auth.currentUser;

  const featured = [
    { code: 'SMTH011', name: 'Calculus 1' },
    { code: 'PHY101', name: 'Physics' },
    { code: 'COS132', name: 'Computer Science 132' },
  ];

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'modules'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMyModules(list);
    });
    return unsub;
  }, [user]);

  const addModule = async ({ code, name }) => {
    if (!user) return;
    const exists = myModules.some((m) => m.code === code);
    if (exists) {
      Alert.alert('Already added', `${code} is already in your modules.`);
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'modules'), {
      code,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setShowModal(false);
  };

  const openModule = (code) => {
    Alert.alert('Open', `Opening ${code}`);
  };

  const isAdded = (code) => myModules.some((m) => m.code === code);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 },
        ]}
      >
        <View style={styles.modulesHeader}>
          <View style={styles.modulesTitleRow}>
            <Image source={require('./assets/icon.png')} style={styles.modulesLogo} />
            <Text style={styles.modulesTitle}>My Modules</Text>
          </View>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addCircle}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {myModules.length === 0 ? (
          <View style={styles.emptyState}>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.bigAdd}>
              <Feather name="plus" size={36} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.emptyTitle}>No modules added</Text>
            <Text style={styles.emptySub}>Add modules to get started</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {myModules.map((m) => (
              <ModuleCard
                key={m.id}
                code={m.code}
                name={m.name}
                actionLabel="Open"
                onPress={() => openModule(m.code)}
              />
            ))}
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <SectionTitle text="Featured Modules" />
          <View style={styles.featuredBox}>
            {featured.map((fm) => (
              <ModuleCard
                key={fm.code}
                code={fm.code}
                name={fm.name}
                actionLabel={isAdded(fm.code) ? 'Open' : 'Add'}
                onPress={() =>
                  isAdded(fm.code) ? openModule(fm.code) : addModule({ code: fm.code, name: fm.name })
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Switch to a better way to Earn</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <AddModuleModal visible={showModal} onClose={() => setShowModal(false)} onSubmit={addModule} />
      <Wave />
    </SafeAreaView>
  );
}

function Placeholder() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Coming soon</Text>
      </View>
      <Wave />
    </SafeAreaView>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8 },
      }}
    >
      <Tab.Screen
        name="Modules"
        component={ModulesScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="home" size={22} color={focused ? '#0053A9' : '#7a7f87'} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={Placeholder}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="search" size={22} color={focused ? '#0053A9' : '#7a7f87'} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Placeholder}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={22} color={focused ? '#0053A9' : '#7a7f87'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function Wave() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.wave, { bottom: -insets.bottom }]}>
      <Svg width="100%" height="160" viewBox="0 0 375 160" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#edf4ff" />
            <Stop offset="1" stopColor="#dfeaff" />
          </LinearGradient>
          <LinearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#e1ecff" />
            <Stop offset="1" stopColor="#cfe2ff" />
          </LinearGradient>
          <LinearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#d6e6ff" />
            <Stop offset="1" stopColor="#c6dbff" />
          </LinearGradient>
        </Defs>
        <Path
          d="M0 60 C 70 30, 150 80, 230 60 C 295 46, 340 52, 375 48 L 375 160 L 0 160 Z"
          fill="url(#g1)"
        />
        <Path
          d="M0 84 C 80 110, 160 56, 240 84 C 300 104, 335 90, 375 102 L 375 160 L 0 160 Z"
          fill="url(#g2)"
        />
        <Path
          d="M0 108 C 90 130, 190 84, 290 112 C 330 124, 355 120, 375 126 L 375 160 L 0 160 Z"
          fill="url(#g3)"
        />
      </Svg>
    </View>
  );
}

function PrimaryButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  iconName,
  rightIconName,
  headerRight,
  isPassword,
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {headerRight}
      </View>
      <View style={styles.inputRow}>
        {iconName ? (
          <Feather name={iconName} size={18} color="#a0a7b5" style={styles.inputIcon} />
        ) : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#a0a7b5"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.toggleButton}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color="#6b7280" />
          </TouchableOpacity>
        ) : rightIconName ? (
          <Feather name={rightIconName} size={18} color="#a0a7b5" style={styles.inputRightIcon} />
        ) : null}
      </View>
    </View>
  );
}

function SplashScreen({ navigation }) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Login');
    }, 1200);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.splashCenter}>
        <Image source={require('./assets/icon.png')} style={styles.splashLogo} />
        <Text style={styles.splashTitle}>StudentMate</Text>
      </View>
      <Wave />
    </SafeAreaView>
  );
}

function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and Confirm Password must match.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          name: fullName,
          email: email.trim().toLowerCase(),
          university,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      Alert.alert('Account created', 'Your account has been created successfully.');
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Registration error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 }]}>
        <LogoHeader title="Create Account" />
        <View style={styles.form}>
          <Field
            label="Full Name"
            placeholder="Full Name"
            iconName="user"
            value={fullName}
            onChangeText={setFullName}
          />
          <Field
            label="Email Address"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            iconName="mail"
          />
          <Field
            label="Select University"
            placeholder="Select University"
            value={university}
            onChangeText={setUniversity}
            iconName="book-open"
            rightIconName="chevron-down"
          />
          <Field
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            iconName="lock"
            isPassword
          />
          <Field
            label="Confirm Password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            iconName="lock"
            isPassword
          />
          <PrimaryButton label={loading ? 'Registering...' : 'Register'} onPress={handleRegister} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryText}>
              Already have an account? <Text style={styles.linkText}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Wave />
    </SafeAreaView>
  );
}

function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing information', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Login error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 }]}>
        <LogoHeader title="Login" />
        <View style={styles.form}>
          <Field
            label="Email Address"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            iconName="mail"
          />
          <Field
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            iconName="lock"
            isPassword
            headerRight={
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordInline}>Forgot Password?</Text>
              </TouchableOpacity>
            }
          />
          <PrimaryButton label={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} />
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryText}>
              Don&apos;t have an account? <Text style={styles.linkText}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Wave />
    </SafeAreaView>
  );
}

function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [showPasswordSample] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Missing information', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Email sent', 'Check your inbox to reset your password.');
    } catch (error) {
      Alert.alert('Reset error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 }]}>
        <LogoHeader title="Forgot Password?" />
        <View style={styles.form}>
          <Field
            label="Email Address"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            iconName="mail"
          />
          <PrimaryButton
            label={loading ? 'Sending...' : 'Reset Password'}
            onPress={handleResetPassword}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Wave />
    </SafeAreaView>
  );
}

import { LogBox } from 'react-native';
import PaywallScreen from './screens/PaywallScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Unsupported class file major version', // Gradle/Java version mismatch
  'The action \'NAVIGATE\' with payload', // Navigation warning
]);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0053A9',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1b1b1f',
  },
  form: {
    flex: 1,
    marginTop: 8,
  },
  field: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#757d8a',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7deec',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f7f8fb',
  },
  inputIcon: {
    marginRight: 8,
  },
  inputRightIcon: {
    marginLeft: 8,
  },
  toggleButton: {
    marginLeft: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222222',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0053A9',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#555555',
    fontSize: 14,
  },
  linkText: {
    color: '#0053A9',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordInline: {
    color: '#0053A9',
    fontSize: 13,
    fontWeight: '500',
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 160,
    width: '100%',
    overflow: 'hidden',
  },
  splashCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0053A9',
  },
  modulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modulesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modulesLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  modulesTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0053A9',
  },
  addCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0053A9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  bigAdd: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#0053A9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b1b1f',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 10,
  },
  cardCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  cardAction: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0053A9',
  },
  cardActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  featuredBox: {
    borderRadius: 16,
    backgroundColor: '#f8f9fb',
    padding: 12,
  },
  banner: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  bannerButton: {
    backgroundColor: '#0053A9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modalSecondaryText: {
    fontSize: 14,
    color: '#4b5563',
  },
  modalPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0053A9',
  },
  modalPrimaryText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
