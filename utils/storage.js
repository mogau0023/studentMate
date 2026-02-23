import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@auth:user';

export async function saveUserToCache(user) {
  try {
    if (!user) return;
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export async function getCachedUser() {
  try {
    const v = await AsyncStorage.getItem(USER_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export async function clearCachedUser() {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch {}
}
