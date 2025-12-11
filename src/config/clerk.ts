import * as SecureStore from 'expo-secure-store';

export const CLERK_PUBLISHABLE_KEY = 'pk_test_aGlwLWFudC00NC5jbGVyay5hY2NvdW50cy5kZXYk';

export const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};
