import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD_jwiALUoQcZIOkfhgvJ1MTUsD4mQD8cU',
  authDomain: 'studomate1.firebaseapp.com',
  projectId: 'studomate1',
  storageBucket: 'studomate1.firebasestorage.app',
  messagingSenderId: '819063499606',
  appId: '1:819063499606:web:79b8457a7333050e0404f7',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // If auth was already initialized (e.g., fast refresh), fall back to existing instance
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);

